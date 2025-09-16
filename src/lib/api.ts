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
    // Fallback for web environment - return demo data
    return getDemoData<T>(command, args)
  }
}

// Demo data for web environment
const getDemoData = <T>(command: string, args?: Record<string, any>): T => {
  const baseAlbums = [
    { album_id: "1", album_name: "The Dark Side of the Moon - Pink Floyd", plays: 47, minutes: 164.5, last_played: Date.now() - 3600000 },
    { album_id: "2", album_name: "Abbey Road - The Beatles", plays: 42, minutes: 147.3, last_played: Date.now() - 7200000 },
    { album_id: "3", album_name: "Thriller - Michael Jackson", plays: 38, minutes: 133.7, last_played: Date.now() - 10800000 },
    { album_id: "4", album_name: "Back in Black - AC/DC", plays: 35, minutes: 122.8, last_played: Date.now() - 14400000 },
    { album_id: "5", album_name: "The Wall - Pink Floyd", plays: 33, minutes: 115.2, last_played: Date.now() - 18000000 },
    { album_id: "6", album_name: "Led Zeppelin IV - Led Zeppelin", plays: 31, minutes: 108.6, last_played: Date.now() - 21600000 },
    { album_id: "7", album_name: "Rumours - Fleetwood Mac", plays: 29, minutes: 101.4, last_played: Date.now() - 25200000 },
    { album_id: "8", album_name: "Hotel California - Eagles", plays: 27, minutes: 94.5, last_played: Date.now() - 28800000 },
    { album_id: "9", album_name: "Nevermind - Nirvana", plays: 25, minutes: 87.5, last_played: Date.now() - 32400000 },
    { album_id: "10", album_name: "OK Computer - Radiohead", plays: 23, minutes: 80.5, last_played: Date.now() - 36000000 },
    { album_id: "11", album_name: "The Joshua Tree - U2", plays: 21, minutes: 73.5, last_played: Date.now() - 39600000 },
    { album_id: "12", album_name: "Appetite for Destruction - Guns N' Roses", plays: 19, minutes: 66.5, last_played: Date.now() - 43200000 },
    { album_id: "13", album_name: "十二樓的莫文蔚 - 莫文蔚", plays: 17, minutes: 59.5, last_played: Date.now() - 46800000 },
    { album_id: "14", album_name: "范特西 - 周杰倫", plays: 15, minutes: 52.5, last_played: Date.now() - 50400000 },
    { album_id: "15", album_name: "The Eminem Show - Eminem", plays: 13, minutes: 45.5, last_played: Date.now() - 54000000 },
  ]

  if (command === 'query_top_albums_window') {
    const window = args?.window || '30d'
    const multiplier = window === '7d' ? 0.3 : window === '30d' ? 1 : window === '180d' ? 3.5 : 7
    
    return baseAlbums.map(album => ({
      ...album,
      plays: Math.round(album.plays * multiplier),
      minutes: album.minutes && album.minutes * multiplier
    })) as T
  }

  // Handle OAuth commands in web environment
  if (command === 'start_oauth_flow') {
    // In web environment, this should not be used - throw error to force proper flow
    throw new Error('Web OAuth flow should use spotifyWebAPI.startAuthFlow() instead of spotifyApi.auth.startOAuthFlow()')
  }
  
  if (command === 'complete_oauth_flow') {
    // In web environment, this would be handled by the redirect
    throw new Error('OAuth flow not supported in web environment. Please use the desktop app.')
  }
  
  // Return empty data for other commands
  return [] as T
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