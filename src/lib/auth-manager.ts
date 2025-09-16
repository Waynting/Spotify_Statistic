/**
 * Unified Authentication Manager
 * Handles both Tauri desktop and web authentication flows
 */

import { spotifyWebAPI } from './spotify-web-api'
import { spotifyApi } from './api'
import config from './config'
import { useAuthStore } from '../store/useAuthStore'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  platform: 'web' | 'tauri'
  method: 'web-oauth' | 'tauri-oauth'
}

export type AuthEventType = 'auth_start' | 'auth_success' | 'auth_error' | 'auth_logout'

export interface AuthEvent {
  type: AuthEventType
  data?: any
  error?: string
}

class AuthManager {
  private listeners: Array<(event: AuthEvent) => void> = []
  private currentState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
    platform: this.detectPlatform(),
    method: this.detectPlatform() === 'tauri' ? 'tauri-oauth' : 'web-oauth'
  }

  constructor() {
    this.initializeAuthState()
  }

  private detectPlatform(): 'web' | 'tauri' {
    return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ ? 'tauri' : 'web'
  }

  private async initializeAuthState() {
    console.log('🚀 Initializing auth state...')
    try {
      // Check if we already have valid tokens
      if (this.currentState.platform === 'web') {
        const isAuth = spotifyWebAPI.isAuthenticated()
        console.log('🔍 Initial auth check:', isAuth)
        this.updateState({
          isAuthenticated: isAuth,
          error: null
        })
        
        // Sync with auth store
        useAuthStore.getState().setAuthenticated(isAuth)
        
        // If authenticated, try to get user profile
        if (isAuth) {
          try {
            const user = await spotifyWebAPI.getCurrentUser()
            console.log('👤 User profile loaded:', user.display_name)
            useAuthStore.getState().setUser(user)
          } catch (error) {
            console.warn('⚠️ Failed to load user profile:', error)
          }
        }
      } else {
        // For Tauri, check via backend
        try {
          // This would need to be implemented in the Tauri backend
          const isAuth = false // await spotifyApi.auth.checkAuthStatus()
          this.updateState({
            isAuthenticated: isAuth,
            error: null
          })
        } catch (error) {
          this.updateState({
            isAuthenticated: false,
            error: null
          })
        }
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error)
      this.updateState({
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown auth error'
      })
    }
  }

  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates }
    this.emit('auth_start', this.currentState)
  }

  private emit(type: AuthEventType, data?: any, error?: string) {
    const event: AuthEvent = { type, data, error }
    this.listeners.forEach(listener => listener(event))
  }

  public subscribe(listener: (event: AuthEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public getState(): AuthState {
    return { ...this.currentState }
  }

  public async login(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })
      this.emit('auth_start')

      if (!config.isConfigured()) {
        throw new Error('請先設置 SPOTIFY_CLIENT_ID 環境變數')
      }

      if (this.currentState.platform === 'web') {
        await this.webLogin()
      } else {
        await this.tauriLogin()
      }

      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      // Sync with auth store
      useAuthStore.getState().setAuthenticated(true)
      
      // Try to get user profile
      if (this.currentState.platform === 'web') {
        try {
          const user = await spotifyWebAPI.getCurrentUser()
          console.log('👤 User profile loaded after login:', user.display_name)
          useAuthStore.getState().setUser(user)
        } catch (error) {
          console.warn('⚠️ Failed to load user profile after login:', error)
        }
      }
      
      this.emit('auth_success', this.currentState)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      })
      this.emit('auth_error', null, errorMessage)
      throw error
    }
  }

  private async webLogin(): Promise<void> {
    const authUrl = await spotifyWebAPI.startAuthFlow()
    
    // For web, we redirect to Spotify
    // The callback will be handled by SpotifyCallback component
    window.location.href = authUrl
  }

  private async tauriLogin(): Promise<void> {
    // Use Tauri's OAuth flow
    const authUrl = await spotifyApi.auth.startOAuthFlow()
    
    // Open in external browser
    window.open(authUrl, '_blank')
    
    // Wait for the callback to be processed
    await spotifyApi.auth.completeOAuthFlow()
  }

  public async handleCallback(code: string, state: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })

      if (this.currentState.platform === 'web') {
        await spotifyWebAPI.handleAuthCallback(code, state)
      }
      // Tauri callbacks are handled differently through the backend

      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      // Sync with auth store
      useAuthStore.getState().setAuthenticated(true)
      
      this.emit('auth_success', this.currentState)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Callback handling failed'
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      })
      this.emit('auth_error', null, errorMessage)
      throw error
    }
  }

  public logout(): void {
    try {
      if (this.currentState.platform === 'web') {
        spotifyWebAPI.logout()
      } else {
        // Clear Tauri tokens
        // This would need to be implemented in the backend
      }

      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
      
      // Sync with auth store
      useAuthStore.getState().logout()
      
      this.emit('auth_logout')

    } catch (error) {
      console.error('Logout error:', error)
      // Force logout anyway
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
      
      // Sync with auth store
      useAuthStore.getState().logout()
      
      this.emit('auth_logout')
    }
  }

  public async refreshToken(): Promise<void> {
    if (this.currentState.platform === 'web') {
      // spotifyWebAPI handles token refresh automatically
      return
    } else {
      // Implement Tauri token refresh
      // This would need to be implemented in the backend
    }
  }

  // Helper method to check authentication across platforms
  public isAuthenticated(): boolean {
    if (this.currentState.platform === 'web') {
      return spotifyWebAPI.isAuthenticated()
    } else {
      return this.currentState.isAuthenticated
    }
  }
}

// Export singleton instance
export const authManager = new AuthManager()
export default authManager