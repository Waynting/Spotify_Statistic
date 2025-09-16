import config from './config'
import {
  SpotifyTokenResponse,
  SpotifyTopTracksResponse,
  SpotifyRecentlyPlayedResponse,
  SpotifyUser,
  SpotifyTopArtistsResponse,
  SpotifyTimeRange
} from '../types/spotify'

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}


class SpotifyWebAPI {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number | null = null

  constructor() {
    // Try to load tokens from localStorage
    this.loadTokensFromStorage()
  }

  private saveTokensToStorage() {
    if (this.accessToken && this.refreshToken && this.tokenExpiry) {
      localStorage.setItem('spotify_access_token', this.accessToken)
      localStorage.setItem('spotify_refresh_token', this.refreshToken)
      localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString())
    }
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('spotify_access_token')
    this.refreshToken = localStorage.getItem('spotify_refresh_token')
    const expiry = localStorage.getItem('spotify_token_expiry')
    this.tokenExpiry = expiry ? parseInt(expiry) : null
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = null
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_token_expiry')
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null && 
           this.tokenExpiry !== null && 
           Date.now() < this.tokenExpiry
  }

  public async startAuthFlow(): Promise<string> {
    if (!config.isConfigured()) {
      throw new Error('需要設置 SPOTIFY_CLIENT_ID 才能使用認證功能')
    }

    // 清除任何舊的 PKCE 參數
    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_state')

    // 生成新的 PKCE 參數
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateRandomString(16) // 16 bytes = 128 bits

    // Store PKCE parameters
    sessionStorage.setItem('spotify_code_verifier', codeVerifier)
    sessionStorage.setItem('spotify_state', state)

    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.append('client_id', config.spotify.clientId)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('redirect_uri', config.spotify.redirectUri)
    authUrl.searchParams.append('scope', config.spotify.scopes)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('state', state)

    return authUrl.toString()
  }

  public async handleAuthCallback(code: string, state: string): Promise<void> {
    const storedState = sessionStorage.getItem('spotify_state')
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier')

    if (state !== storedState) {
      throw new Error('State mismatch')
    }

    if (!codeVerifier) {
      throw new Error('Code verifier not found')
    }

    const tokenData = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.spotify.redirectUri,
      client_id: config.spotify.clientId,
      code_verifier: codeVerifier,
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenData),
      })

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`)
      }

      const tokens: SpotifyTokenResponse = await response.json()
      
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token || null
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000)
      
      this.saveTokensToStorage()
      
      // Clear session storage
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_state')
      
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: config.spotify.clientId,
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenData),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const tokens: SpotifyTokenResponse = await response.json()
      
      this.accessToken = tokens.access_token
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000)
      
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token
      }
      
      this.saveTokensToStorage()
      
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
    if (!this.isAuthenticated()) {
      if (this.refreshToken) {
        await this.refreshAccessToken()
      } else {
        throw new Error('Not authenticated')
      }
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })

    if (response.status === 401) {
      // Token expired, try to refresh
      if (this.refreshToken) {
        await this.refreshAccessToken()
        // Retry the request
        return this.makeAuthenticatedRequest<T>(endpoint)
      } else {
        this.clearTokens()
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  }

  public async getTopTracks(timeRange: SpotifyTimeRange = 'medium_term', limit: number = 50): Promise<SpotifyTopTracksResponse> {
    return this.makeAuthenticatedRequest<SpotifyTopTracksResponse>(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
  }

  public async getRecentlyPlayed(limit: number = 50): Promise<SpotifyRecentlyPlayedResponse> {
    return this.makeAuthenticatedRequest<SpotifyRecentlyPlayedResponse>(`/me/player/recently-played?limit=${limit}`)
  }

  public async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeAuthenticatedRequest('/me')
  }

  public async getTopArtists(timeRange: SpotifyTimeRange = 'medium_term', limit = 20): Promise<SpotifyTopArtistsResponse> {
    return this.makeAuthenticatedRequest(`/me/top/artists?time_range=${timeRange}&limit=${limit}`)
  }

  public logout(): void {
    this.clearTokens()
  }

}

// Export singleton instance
export const spotifyWebAPI = new SpotifyWebAPI()
export default spotifyWebAPI