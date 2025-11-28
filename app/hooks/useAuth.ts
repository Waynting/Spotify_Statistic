/**
 * React hook for Spotify authentication
 * Uses spotifyWebAPI for OAuth PKCE flow
 * Also registers user with backend for data storage
 */

import { useState, useEffect, useCallback } from 'react'
import { spotifyWebAPI } from '@/lib/spotify-web-api'
import { useAuthStore } from '@/store/useAuthStore'
import { backendAPI } from '@/lib/backend-api'

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = spotifyWebAPI.isAuthenticated()
      useAuthStore.getState().setAuthenticated(authenticated)
    }
    
    checkAuth()
    // Check periodically (every 5 minutes) to catch token expiry
    const interval = setInterval(checkAuth, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const login = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Start OAuth flow - redirects to Spotify
      const authUrl = await spotifyWebAPI.startAuthFlow()
      window.location.href = authUrl
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    try {
      spotifyWebAPI.logout()
      useAuthStore.getState().logout()
      setError(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout anyway
      useAuthStore.getState().logout()
    }
  }, [])

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await spotifyWebAPI.handleAuthCallback(code, state)
      useAuthStore.getState().setAuthenticated(true)
      
      // Try to get user profile
      let user
      try {
        user = await spotifyWebAPI.getCurrentUser()
        useAuthStore.getState().setUser(user)
      } catch (error) {
        console.warn('Failed to load user profile:', error)
      }
      
      // Register user with backend for data storage
      if (user && spotifyWebAPI.isAuthenticated()) {
        try {
          const tokens = spotifyWebAPI.getTokens()
          if (tokens) {
            await backendAPI.registerUser({
              spotify_user_id: user.id,
              email: user.email,
              display_name: user.display_name || undefined,
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken || undefined,
              expires_in: tokens.expiresIn || 3600
            })
            console.log('✅ User registered with backend')
          }
        } catch (error) {
          // Don't fail auth if backend registration fails
          console.warn('Failed to register user with backend:', error)
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Callback handling failed'
      setError(errorMessage)
      console.error('Callback handling failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    handleCallback,
    
    // Utilities
    isAuthenticatedCheck: () => spotifyWebAPI.isAuthenticated()
  }
}