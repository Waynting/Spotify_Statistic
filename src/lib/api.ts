import { AlbumRow } from '../types'
import config from './config'

// Check if we're running in Tauri environment
const isTauriApp = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__
}

// Safe invoke wrapper that handles both Tauri and web environments
const safeInvoke = async <T>(command: string, args?: Record<string, any>): Promise<T> => {
  if (isTauriApp()) {
    try {
      // Dynamic import of Tauri invoke
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke<T>(command, args)
    } catch (error) {
      console.warn(`Tauri command ${command} failed:`, error)
      throw error
    }
  } else {
    // Web environment - return appropriate fallback for data commands
    return handleWebEnvironmentCommand<T>(command, args)
  }
}

// Handle commands in web environment with appropriate fallbacks
const handleWebEnvironmentCommand = <T>(command: string, args?: Record<string, any>): T => {
  console.log(`Web environment: handling command ${command}`)
  
  switch (command) {
    case 'query_top_albums_window':
      // Return empty array for data queries in web environment
      return [] as T
    
    case 'start_oauth_flow':
      // Web OAuth should use spotifyWebAPI instead
      throw new Error('Web OAuth flow should use spotifyWebAPI.startAuthFlow() instead of spotifyApi.auth.startOAuthFlow()')
    
    case 'complete_oauth_flow':
    case 'handle_oauth_callback':
      throw new Error('OAuth flow not supported via Tauri API in web environment. Use web-based OAuth.')
    
    case 'get_devices':
    case 'play_context':
    case 'transfer_playback':
      // Player commands not supported in web environment
      throw new Error(`Player command ${command} not supported in web environment. Use Spotify Web Playback SDK.`)
    
    case 'seed_dummy_events':
    case 'sync_recent_played':
    case 'sync_top_items':
      // Sync commands not needed in web environment
      console.log(`Sync command ${command} not needed in web environment`)
      return undefined as T
    
    default:
      console.warn(`Unknown command ${command} in web environment`)
      return [] as T
  }
}


export const spotifyApi = {
  auth: {
    startOAuthFlow: () => safeInvoke<string>('start_oauth_flow'),
    completeOAuthFlow: () => safeInvoke('complete_oauth_flow'),
    handleCallback: (code: string, state: string) => 
      safeInvoke('handle_oauth_callback', { code, state }),
  },
  
  player: {
    getDevices: () => safeInvoke<any[]>('get_devices'),
    playContext: (deviceId: string | null, contextUri: string, offset?: number) =>
      safeInvoke('play_context', { deviceId, contextUri, offset }),
    transferPlayback: (deviceId: string, play: boolean) =>
      safeInvoke('transfer_playback', { deviceId, play }),
  },
  
  data: {
    queryTopAlbumsWindow: (window: string) => 
      safeInvoke<AlbumRow[]>('query_top_albums_window', { window }),
    seedDummyEvents: () => safeInvoke('seed_dummy_events'),
    syncRecentPlayed: () => safeInvoke('sync_recent_played'),
    syncTopItems: () => safeInvoke('sync_top_items'),
  },
}