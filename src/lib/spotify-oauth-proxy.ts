// Spotify One-Click Authentication Service
// Implements simple one-click "Connect with Spotify" flow

interface SpotifyOAuthResponse {
  success: boolean
  authUrl?: string
  error?: string
}

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

class SpotifyOneClickAuth {
  
  /**
   * 一鍵啟動 Spotify OAuth 認證流程
   */
  public async startOneClickAuth(): Promise<SpotifyOAuthResponse> {
    try {
      // 清除任何舊的 PKCE 參數，確保每次都是全新的
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_state')
      
      // 生成新的 PKCE 參數
      const codeVerifier = this.generateCodeVerifier()
      const codeChallenge = await this.generateCodeChallenge(codeVerifier)
      const state = this.generateRandomString(16)
      
      // 儲存 PKCE 參數到 sessionStorage
      sessionStorage.setItem('spotify_code_verifier', codeVerifier)
      sessionStorage.setItem('spotify_state', state)
      
      // 構建授權 URL
      const authUrl = this.buildAuthUrl(codeChallenge, state)
      
      return {
        success: true,
        authUrl
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '認證初始化失敗'
      }
    }
  }
  
  /**
   * 構建 Spotify 授權 URL
   */
  private buildAuthUrl(codeChallenge: string, state: string): string {
    const clientId = this.getClientId()
    if (!clientId) {
      throw new Error('Spotify Client ID 未設定。請在 .env 檔案中設定 VITE_SPOTIFY_CLIENT_ID')
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: this.getRedirectUri(),
      scope: this.getDefaultScopes(),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state: state,
      show_dialog: 'true' // 總是顯示授權對話框確保用戶明確授權
    })
    
    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }
  
  /**
   * 生成 PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  /**
   * 生成 PKCE code challenge
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  /**
   * 生成隨機字串
   */
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  /**
   * 處理授權回調並交換 token
   */
  public async handleCallback(code: string, state?: string): Promise<SpotifyTokenResponse> {
    try {
      return await this.exchangeCodeForToken(code, state)
    } catch (error) {
      throw new Error(`Token 交換失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }
  
  /**
   * 交換授權碼獲取 access token (使用 PKCE)
   */
  private async exchangeCodeForToken(code: string, state?: string): Promise<SpotifyTokenResponse> {
    const clientId = this.getClientId()
    if (!clientId) {
      throw new Error('找不到 Client ID，請檢查環境配置')
    }

    // 驗證 state 參數
    const storedState = sessionStorage.getItem('spotify_state')
    if (state && state !== storedState) {
      throw new Error('State mismatch - 可能存在安全風險')
    }

    // 取得 PKCE code verifier
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
    if (!codeVerifier) {
      throw new Error('找不到 PKCE code verifier')
    }

    const tokenData: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.getRedirectUri(),
      client_id: clientId,
      code_verifier: codeVerifier
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(tokenData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || 'Token 交換失敗')
    }

    // 清除 session storage 中的 PKCE 參數
    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_state')
    
    return await response.json()
  }
  
  /**
   * 獲取 Client ID
   */
  private getClientId(): string {
    return import.meta.env.VITE_SPOTIFY_CLIENT_ID || 
           localStorage.getItem('spotify_client_id') || 
           ''
  }
  
  /**
   * 獲取重定向 URI
   */
  private getRedirectUri(): string {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__
    return isTauri 
      ? 'http://127.0.0.1:8001/callback'
      : 'http://127.0.0.1:8000/callback'
  }
  
  /**
   * 獲取默認權限範圍
   */
  private getDefaultScopes(): string {
    return [
      'user-top-read',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ')
  }
}

export const spotifyOneClickAuth = new SpotifyOneClickAuth()
export default spotifyOneClickAuth

// Keep backward compatibility
export const spotifyOAuthProxy = spotifyOneClickAuth