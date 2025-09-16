import { create } from 'zustand'
import { spotifyWebAPI } from '../lib/spotify-web-api'

interface AuthState {
  isAuthenticated: boolean
  user: any | null
  setAuthenticated: (authenticated: boolean) => void
  setUser: (user: any) => void
  logout: () => void
  checkAuthStatus: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  setAuthenticated: (authenticated) => {
    console.log('🔐 Auth status changed:', authenticated)
    set({ isAuthenticated: authenticated })
  },
  setUser: (user) => {
    console.log('👤 User data updated:', user?.display_name || 'No name')
    set({ user })
  },
  logout: () => {
    console.log('🚪 Logging out')
    set({ isAuthenticated: false, user: null })
  },
  checkAuthStatus: () => {
    const isAuth = spotifyWebAPI.isAuthenticated()
    console.log('🔍 Checking auth status:', isAuth)
    if (get().isAuthenticated !== isAuth) {
      set({ isAuthenticated: isAuth })
    }
  }
}))