/**
 * 認證和 API 呼叫調試工具
 */

import { spotifyWebAPI } from './spotify-web-api'
import config from './config'

export interface AuthDebugInfo {
  isAuthenticated: boolean
  hasAccessToken: boolean
  hasRefreshToken: boolean
  tokenExpiry: number | null
  isTokenExpired: boolean
  clientId: string
  scopes: string
  redirectUri: string
  userProfile: any
  apiTestResults: {
    topTracks: { success: boolean, error?: string, data?: any }
    recentlyPlayed: { success: boolean, error?: string, data?: any }
    topArtists: { success: boolean, error?: string, data?: any }
    userProfile: { success: boolean, error?: string, data?: any }
  }
}

export class AuthDebugger {
  async getDebugInfo(): Promise<AuthDebugInfo> {
    const hasAccessToken = !!localStorage.getItem('spotify_access_token')
    const hasRefreshToken = !!localStorage.getItem('spotify_refresh_token')
    const tokenExpiry = localStorage.getItem('spotify_token_expiry')
    const tokenExpiryNumber = tokenExpiry ? parseInt(tokenExpiry) : null
    const isTokenExpired = tokenExpiryNumber ? Date.now() > tokenExpiryNumber : true
    
    const info: AuthDebugInfo = {
      isAuthenticated: spotifyWebAPI.isAuthenticated(),
      hasAccessToken,
      hasRefreshToken,
      tokenExpiry: tokenExpiryNumber,
      isTokenExpired,
      clientId: config.spotify.clientId,
      scopes: config.spotify.scopes,
      redirectUri: config.spotify.redirectUri,
      userProfile: null,
      apiTestResults: {
        topTracks: { success: false },
        recentlyPlayed: { success: false },
        topArtists: { success: false },
        userProfile: { success: false }
      }
    }

    // 如果有 token，測試各個 API 端點
    if (hasAccessToken && !isTokenExpired) {
      await this.testApiEndpoints(info)
    }

    return info
  }

  private async testApiEndpoints(info: AuthDebugInfo) {
    // 測試用戶資料
    try {
      const userProfile = await spotifyWebAPI.getCurrentUser()
      info.apiTestResults.userProfile = { success: true, data: userProfile }
      info.userProfile = userProfile
    } catch (error) {
      info.apiTestResults.userProfile = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // 測試 Top Tracks
    try {
      const topTracks = await spotifyWebAPI.getTopTracks('short_term', 5)
      info.apiTestResults.topTracks = { 
        success: true, 
        data: { 
          total: topTracks.items?.length || 0,
          hasItems: topTracks.items && topTracks.items.length > 0,
          firstTrack: topTracks.items?.[0]?.name || 'None'
        }
      }
    } catch (error) {
      info.apiTestResults.topTracks = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // 測試最近播放
    try {
      const recentlyPlayed = await spotifyWebAPI.getRecentlyPlayed(5)
      info.apiTestResults.recentlyPlayed = { 
        success: true, 
        data: { 
          total: recentlyPlayed.items?.length || 0,
          hasItems: recentlyPlayed.items && recentlyPlayed.items.length > 0,
          firstTrack: recentlyPlayed.items?.[0]?.track?.name || 'None'
        }
      }
    } catch (error) {
      info.apiTestResults.recentlyPlayed = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    // 測試熱門藝人
    try {
      const topArtists = await spotifyWebAPI.getTopArtists('short_term', 5)
      info.apiTestResults.topArtists = { 
        success: true, 
        data: { 
          total: topArtists.items?.length || 0,
          hasItems: topArtists.items && topArtists.items.length > 0,
          firstArtist: topArtists.items?.[0]?.name || 'None'
        }
      }
    } catch (error) {
      info.apiTestResults.topArtists = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async clearAllTokens() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_token_expiry')
    localStorage.removeItem('spotify_code_verifier')
    localStorage.removeItem('spotify_state')
  }

  logDebugInfo(info: AuthDebugInfo) {
    console.group('🔍 Spotify 認證調試資訊')
    
    console.group('📋 基本資訊')
    console.log('已認證:', info.isAuthenticated)
    console.log('有 Access Token:', info.hasAccessToken)
    console.log('有 Refresh Token:', info.hasRefreshToken)
    console.log('Token 到期時間:', info.tokenExpiry ? new Date(info.tokenExpiry) : 'None')
    console.log('Token 已過期:', info.isTokenExpired)
    console.groupEnd()

    console.group('⚙️ 設定資訊')
    console.log('Client ID:', info.clientId || '未設定')
    console.log('權限範圍:', info.scopes)
    console.log('重定向 URI:', info.redirectUri)
    console.groupEnd()

    if (info.userProfile) {
      console.group('👤 用戶資料')
      console.log('用戶名:', info.userProfile.display_name)
      console.log('用戶 ID:', info.userProfile.id)
      console.log('追蹤者數量:', info.userProfile.followers?.total || 0)
      console.log('國家:', info.userProfile.country)
      console.groupEnd()
    }

    console.group('🔌 API 測試結果')
    Object.entries(info.apiTestResults).forEach(([endpoint, result]) => {
      if (result.success) {
        console.log(`✅ ${endpoint}:`, result.data)
      } else {
        console.log(`❌ ${endpoint}:`, result.error)
      }
    })
    console.groupEnd()

    console.groupEnd()
  }
}

export const authDebugger = new AuthDebugger()