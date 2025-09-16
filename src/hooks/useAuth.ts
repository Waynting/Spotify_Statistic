/**
 * React hook for unified authentication
 */

import { useState, useEffect, useCallback } from 'react'
import { authManager, AuthState, AuthEvent } from '../lib/auth-manager'

export function useAuth() {
  const [state, setState] = useState<AuthState>(authManager.getState())

  useEffect(() => {
    const unsubscribe = authManager.subscribe((event: AuthEvent) => {
      setState(authManager.getState())
    })

    return unsubscribe
  }, [])

  const login = useCallback(async () => {
    try {
      await authManager.login()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    authManager.logout()
  }, [])

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      await authManager.handleCallback(code, state)
    } catch (error) {
      console.error('Callback handling failed:', error)
      throw error
    }
  }, [])

  return {
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    platform: state.platform,
    method: state.method,
    
    // Actions
    login,
    logout,
    handleCallback,
    
    // Utilities
    isAuthenticatedCheck: authManager.isAuthenticated.bind(authManager)
  }
}