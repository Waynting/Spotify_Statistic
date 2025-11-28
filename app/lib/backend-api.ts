/**
 * Backend API client for Spotify Statistic
 * Handles communication with the backend server for historical data
 */

// Next.js API routes are same origin, so we use relative paths
const BACKEND_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

interface BackendTrack {
  track_id: string
  track_name: string
  artist_name: string
  album_name: string
  plays: number
  duration_ms: number
  popularity: number
  last_played: string
}

interface BackendArtist {
  artist_id: string
  artist_name: string
  plays: number
  minutes: number
}

interface BackendStats {
  window: string
  total_plays: number
  total_minutes: number
  unique_tracks: number
  unique_artists: number
  unique_albums: number
  days_with_data: number
}

class BackendAPI {
  private getHeaders(spotifyUserId?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (spotifyUserId) {
      headers['x-spotify-user-id'] = spotifyUserId
    }
    
    return headers
  }

  /**
   * Register or update user with Spotify OAuth tokens
   */
  async registerUser(data: {
    spotify_user_id: string
    email?: string
    display_name?: string
    access_token: string
    refresh_token?: string
    expires_in: number
  }): Promise<{ success: boolean; user: any }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/spotify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Backend API error: ${response.status} ${response.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage += ` - ${errorJson.error || errorText}`
        } catch {
          errorMessage += ` - ${errorText}`
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Backend API error: ${String(error)}`)
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(spotifyUserId: string): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: this.getHeaders(spotifyUserId)
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Backend API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get historical track data from backend
   */
  async getHistoricalTracks(spotifyUserId: string, window: string): Promise<BackendTrack[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/tracks?window=${window}`, {
        headers: this.getHeaders(spotifyUserId)
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Backend API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.tracks || []
    } catch (error) {
      console.warn('Failed to fetch historical tracks from backend:', error)
      return []
    }
  }

  /**
   * Get historical artist data from backend
   */
  async getHistoricalArtists(spotifyUserId: string, window: string): Promise<BackendArtist[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/artists?window=${window}`, {
        headers: this.getHeaders(spotifyUserId)
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Backend API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.artists || []
    } catch (error) {
      console.warn('Failed to fetch historical artists from backend:', error)
      return []
    }
  }

  /**
   * Get aggregated statistics from backend
   */
  async getStats(spotifyUserId: string, window: string): Promise<BackendStats | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/stats?window=${window}`, {
        headers: this.getHeaders(spotifyUserId)
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Backend API error: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.warn('Failed to fetch stats from backend:', error)
      return null
    }
  }

  /**
   * Trigger manual data synchronization
   */
  async triggerSync(spotifyUserId: string): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/sync`, {
      method: 'POST',
      headers: this.getHeaders(spotifyUserId)
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`)
    }

    return response.json()
  }
}

export const backendAPI = new BackendAPI()
export type { BackendTrack, BackendArtist, BackendStats }

