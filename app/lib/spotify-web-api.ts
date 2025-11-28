import config from './config'
import {
  SpotifyTokenResponse,
  SpotifyTopTracksResponse,
  SpotifyRecentlyPlayedResponse,
  SpotifyRecentlyPlayedTrack,
  SpotifyUser,
  SpotifyTopArtistsResponse,
  SpotifyTimeRange,
  SpotifyTrack,
  SpotifyArtist
} from '@/types/spotify'

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined'

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
    // If tokens are invalid or expired, they will be cleared
    this.loadTokensFromStorage()
  }

  /**
   * Save tokens to localStorage
   * Security Note: Tokens are stored in localStorage which is accessible to JavaScript
   * This is acceptable for web apps as:
   * - Access tokens are short-lived (1 hour)
   * - Refresh tokens are scoped and can be revoked
   * - localStorage is protected by same-origin policy
   * - XSS protection should be implemented at application level
   */
  private saveTokensToStorage() {
    if (!isBrowser) return
    if (this.accessToken && this.refreshToken && this.tokenExpiry) {
      try {
        localStorage.setItem('spotify_access_token', this.accessToken)
        localStorage.setItem('spotify_refresh_token', this.refreshToken)
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString())
      } catch (error) {
        console.error('Failed to save tokens to localStorage:', error)
        // Clear tokens if storage fails
        this.clearTokens()
      }
    }
  }

  /**
   * Load tokens from localStorage
   * Returns false if tokens are invalid or expired
   * Public to allow re-initialization after hydration
   */
  public loadTokensFromStorage(): boolean {
    if (!isBrowser) return false
    try {
      this.accessToken = localStorage.getItem('spotify_access_token')
      this.refreshToken = localStorage.getItem('spotify_refresh_token')
      const expiry = localStorage.getItem('spotify_token_expiry')
      this.tokenExpiry = expiry ? parseInt(expiry, 10) : null

      // Validate token expiry
      if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
        // Token expired, clear it
        this.clearTokens()
        return false
      }

      return !!(this.accessToken && this.refreshToken && this.tokenExpiry)
    } catch (error) {
      console.error('Failed to load tokens from localStorage:', error)
      this.clearTokens()
      return false
    }
  }

  /**
   * Clear all tokens from memory and storage
   * Security: Ensures tokens are completely removed
   */
  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = null
    if (!isBrowser) return
    try {
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error)
    }
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null && 
           this.tokenExpiry !== null && 
           Date.now() < this.tokenExpiry
  }

  /**
   * Get current tokens (for backend registration)
   */
  public getTokens(): { accessToken: string; refreshToken: string | null; expiresIn: number | null } | null {
    if (!this.accessToken) return null
    
    const expiresIn = this.tokenExpiry 
      ? Math.floor((this.tokenExpiry - Date.now()) / 1000)
      : null
    
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresIn
    }
  }

  public async startAuthFlow(): Promise<string> {
    if (!isBrowser) {
      throw new Error('認證流程只能在瀏覽器環境中執行')
    }
    if (!config.isConfigured()) {
      throw new Error('需要設置 SPOTIFY_CLIENT_ID 才能使用認證功能')
    }

    // Security: Clear any old PKCE parameters to prevent reuse attacks
    try {
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_state')
    } catch (error) {
      console.warn('Failed to clear old PKCE parameters:', error)
    }

    // Generate new PKCE parameters
    // Security: PKCE (Proof Key for Code Exchange) prevents authorization code interception
    const codeVerifier = generateCodeVerifier() // Random 32-byte string
    const codeChallenge = await generateCodeChallenge(codeVerifier) // SHA256 hash
    const state = generateRandomString(16) // 16 bytes = 128 bits for CSRF protection

    // Store PKCE parameters in localStorage (persists across redirects)
    try {
      localStorage.setItem('spotify_code_verifier', codeVerifier)
      localStorage.setItem('spotify_state', state)
    } catch (error) {
      throw new Error('無法儲存認證參數，請檢查瀏覽器設定')
    }

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
    if (!isBrowser) {
      throw new Error('認證回調只能在瀏覽器環境中執行')
    }

    // Security: Validate state parameter to prevent CSRF attacks
    const storedState = localStorage.getItem('spotify_state')
    const codeVerifier = localStorage.getItem('spotify_code_verifier')

    console.log('🔐 Auth callback - URL state:', state)
    console.log('🔐 Auth callback - Stored state:', storedState)
    console.log('🔐 Auth callback - Code verifier exists:', !!codeVerifier)

    if (!storedState || state !== storedState) {
      console.error('🔐 State mismatch! URL:', state, 'Stored:', storedState)
      // Clear tokens and PKCE params on security failure
      this.clearTokens()
      try {
        localStorage.removeItem('spotify_code_verifier')
        localStorage.removeItem('spotify_state')
      } catch {}
      throw new Error('State mismatch - 可能存在安全風險，請重新認證')
    }

    if (!codeVerifier) {
      throw new Error('Code verifier not found - 認證流程異常，請重新開始')
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

      // Security: Clear PKCE parameters from localStorage after successful token exchange
      // This prevents reuse of authorization codes
      try {
        localStorage.removeItem('spotify_code_verifier')
        localStorage.removeItem('spotify_state')
      } catch (error) {
        console.warn('Failed to clear PKCE parameters:', error)
      }
      
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

  private async makeAuthenticatedRequest<T>(endpoint: string, retryCount: number = 0): Promise<T> {
    const maxRetries = 3

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

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      if (this.refreshToken) {
        await this.refreshAccessToken()
        // Retry the request once after refresh
        return this.makeAuthenticatedRequest<T>(endpoint, retryCount)
      } else {
        this.clearTokens()
        throw new Error('Authentication failed: No refresh token available')
      }
    }

    // Handle 429 Too Many Requests - rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000
      
      if (retryCount < maxRetries) {
        console.warn(`Rate limited. Retrying after ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.makeAuthenticatedRequest<T>(endpoint, retryCount + 1)
      } else {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
    }

    // Handle 503 Service Unavailable
    if (response.status === 503) {
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000
        console.warn(`Service unavailable. Retrying after ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.makeAuthenticatedRequest<T>(endpoint, retryCount + 1)
      } else {
        throw new Error('Spotify API is temporarily unavailable. Please try again later.')
      }
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error?.message) {
          errorMessage = `Spotify API error: ${errorData.error.message}`
        }
      } catch {
        // If response is not JSON, use default error message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  public async getTopTracks(timeRange: SpotifyTimeRange = 'medium_term', limit: number = 50, offset: number = 0): Promise<SpotifyTopTracksResponse> {
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: limit.toString(),
      offset: offset.toString()
    })
    return this.makeAuthenticatedRequest<SpotifyTopTracksResponse>(`/me/top/tracks?${params}`)
  }

  public async getRecentlyPlayed(limit: number = 50, before?: number, after?: number): Promise<SpotifyRecentlyPlayedResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    // Note: before and after cannot be used together per Spotify API docs
    if (before) {
      params.append('before', before.toString())
    } else if (after) {
      params.append('after', after.toString())
    }
    return this.makeAuthenticatedRequest<SpotifyRecentlyPlayedResponse>(`/me/player/recently-played?${params}`)
  }

  // Fetch multiple pages of recently played tracks
  // Note: Spotify API can only return up to ~50 recently played tracks per request
  // This method attempts to fetch multiple pages, but may be limited by API constraints
  public async getRecentlyPlayedMultiple(maxTracks: number = 200): Promise<SpotifyRecentlyPlayedTrack[]> {
    const allTracks: SpotifyRecentlyPlayedTrack[] = []
    let before: number | undefined = undefined
    const batchSize = 50 // Spotify API max limit per request
    let requestCount = 0
    const maxRequests = Math.ceil(maxTracks / batchSize) // Limit requests to avoid rate limits

    try {
      while (allTracks.length < maxTracks && requestCount < maxRequests) {
        const response = await this.getRecentlyPlayed(batchSize, before)

        if (!response.items || response.items.length === 0) {
          break // No more data available
        }

        allTracks.push(...response.items)
        requestCount++

        // Use the cursor to get the next page (older tracks)
        // Note: Spotify API may not always provide cursors.before for historical data
        if (response.cursors?.before) {
          const nextBefore = parseInt(response.cursors.before)
          // Avoid infinite loops: check if we're getting the same cursor
          if (before === nextBefore || allTracks.length >= maxTracks) {
            break
          }
          before = nextBefore
        } else {
          // No cursor means no more pages available
          break
        }

        // Rate limiting: wait between requests to avoid hitting API limits
        // Spotify allows 300 requests per 30 seconds for authenticated users
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ Fetched ${allTracks.length} recently played tracks across ${requestCount} requests`)
      return allTracks.slice(0, maxTracks)
    } catch (error) {
      console.error('Error fetching multiple recently played:', error)
      // Return what we have so far instead of failing completely
      return allTracks
    }
  }

  public async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeAuthenticatedRequest('/me')
  }

  public async getTopArtists(timeRange: SpotifyTimeRange = 'medium_term', limit: number = 20, offset: number = 0): Promise<SpotifyTopArtistsResponse> {
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: limit.toString(),
      offset: offset.toString()
    })
    return this.makeAuthenticatedRequest<SpotifyTopArtistsResponse>(`/me/top/artists?${params}`)
  }

  /**
   * Fetch multiple pages of top tracks using offset pagination
   * Spotify API allows up to 50 items per request, so we can fetch up to 200 tracks (4 pages)
   * This improves data accuracy for longer time windows
   */
  public async getTopTracksMultiple(timeRange: SpotifyTimeRange = 'medium_term', maxTracks: number = 200): Promise<SpotifyTrack[]> {
    const allTracks: SpotifyTrack[] = []
    const batchSize = 50 // Spotify API max limit per request
    let offset = 0
    let requestCount = 0
    const maxRequests = Math.ceil(maxTracks / batchSize)

    try {
      while (allTracks.length < maxTracks && requestCount < maxRequests) {
        const response = await this.getTopTracks(timeRange, batchSize, offset)

        if (!response.items || response.items.length === 0) {
          break // No more data available
        }

        allTracks.push(...response.items)
        requestCount++

        // Check if there are more pages
        if (response.items.length < batchSize || !response.next) {
          break // No more pages
        }

        offset += batchSize

        // Rate limiting: wait between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ Fetched ${allTracks.length} top tracks across ${requestCount} requests`)
      return allTracks.slice(0, maxTracks)
    } catch (error) {
      console.error('Error fetching multiple top tracks:', error)
      return allTracks // Return what we have so far
    }
  }

  /**
   * Fetch multiple pages of top artists using pagination
   * Spotify API allows up to 50 items per request, so we use offset to get more
   */
  public async getTopArtistsMultiple(timeRange: SpotifyTimeRange = 'medium_term', maxArtists: number = 200): Promise<SpotifyArtist[]> {
    const allArtists: SpotifyArtist[] = []
    const batchSize = 50 // Spotify API max limit per request
    let offset = 0
    let requestCount = 0
    const maxRequests = Math.ceil(maxArtists / batchSize)

    try {
      while (allArtists.length < maxArtists && requestCount < maxRequests) {
        const response = await this.getTopArtists(timeRange, batchSize, offset)

        if (!response.items || response.items.length === 0) {
          break // No more data available
        }

        allArtists.push(...response.items)
        requestCount++

        // Check if there are more pages
        if (response.items.length < batchSize || !response.next) {
          break // No more pages
        }

        offset += batchSize

        // Rate limiting: wait between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ Fetched ${allArtists.length} top artists across ${requestCount} requests`)
      return allArtists.slice(0, maxArtists)
    } catch (error) {
      console.error('Error fetching multiple top artists:', error)
      return allArtists // Return what we have so far
    }
  }

  public logout(): void {
    this.clearTokens()
  }

}

// Export singleton instance
export const spotifyWebAPI = new SpotifyWebAPI()
export default spotifyWebAPI