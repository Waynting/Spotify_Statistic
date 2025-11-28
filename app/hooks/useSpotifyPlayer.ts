import { useState, useEffect } from 'react'
import { spotifyWebAPI } from '@/lib/spotify-web-api'

interface SpotifyDevice {
  id: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number | null
}

interface PlaybackState {
  device: SpotifyDevice
  repeat_state: string
  shuffle_state: boolean
  context: {
    type: string
    href: string
    external_urls: {
      spotify: string
    }
    uri: string
  } | null
  timestamp: number
  progress_ms: number | null
  is_playing: boolean
  item: {
    id: string
    name: string
    artists: Array<{ name: string }>
    album: {
      name: string
      images: Array<{ url: string }>
    }
    duration_ms: number
  } | null
  currently_playing_type: string
  actions: {
    interrupting_playback?: boolean
    pausing?: boolean
    resuming?: boolean
    seeking?: boolean
    skipping_next?: boolean
    skipping_prev?: boolean
    toggling_repeat_context?: boolean
    toggling_shuffle?: boolean
    toggling_repeat_track?: boolean
    transferring_playback?: boolean
  }
}

export function useSpotifyPlayer() {
  const [devices, setDevices] = useState<SpotifyDevice[]>([])
  const [currentDevice, setCurrentDevice] = useState<SpotifyDevice | null>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDevices = async () => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      setIsLoading(true)
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
        
        const activeDevice = data.devices?.find((device: SpotifyDevice) => device.is_active)
        if (activeDevice) {
          setCurrentDevice(activeDevice)
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlaybackState = async () => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`
        }
      })
      
      if (response.ok && response.status !== 204) {
        const data = await response.json()
        setPlaybackState(data)
        if (data.device) {
          setCurrentDevice(data.device)
        }
      } else if (response.status === 204) {
        setPlaybackState(null)
      }
    } catch (error) {
      console.error('Failed to fetch playback state:', error)
    }
  }

  const transferPlayback = async (deviceId: string) => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      setIsLoading(true)
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })

      if (response.ok) {
        await fetchDevices()
        await fetchPlaybackState()
      }
    } catch (error) {
      console.error('Failed to transfer playback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const play = async (contextUri?: string, offset?: number) => {
    if (!spotifyWebAPI.isAuthenticated() || !currentDevice) return

    try {
      const body: any = {}
      if (contextUri) {
        body.context_uri = contextUri
      }
      if (offset !== undefined) {
        body.offset = { position: offset }
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play${currentDevice ? `?device_id=${currentDevice.id}` : ''}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`,
          'Content-Type': 'application/json'
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      })

      if (response.ok) {
        setTimeout(fetchPlaybackState, 500)
      }
    } catch (error) {
      console.error('Failed to play:', error)
    }
  }

  const pause = async () => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`
        }
      })

      if (response.ok) {
        setTimeout(fetchPlaybackState, 500)
      }
    } catch (error) {
      console.error('Failed to pause:', error)
    }
  }

  const next = async () => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`
        }
      })

      if (response.ok) {
        setTimeout(fetchPlaybackState, 500)
      }
    } catch (error) {
      console.error('Failed to skip to next:', error)
    }
  }

  const previous = async () => {
    if (!spotifyWebAPI.isAuthenticated()) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(spotifyWebAPI as any).accessToken}`
        }
      })

      if (response.ok) {
        setTimeout(fetchPlaybackState, 500)
      }
    } catch (error) {
      console.error('Failed to skip to previous:', error)
    }
  }

  useEffect(() => {
    if (spotifyWebAPI.isAuthenticated()) {
      fetchDevices()
      fetchPlaybackState()
      
      // Poll for playback state every 5 seconds
      const interval = setInterval(fetchPlaybackState, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  return {
    devices,
    currentDevice,
    playbackState,
    isLoading,
    fetchDevices,
    transferPlayback,
    play,
    pause,
    next,
    previous,
    refresh: () => {
      fetchDevices()
      fetchPlaybackState()
    }
  }
}