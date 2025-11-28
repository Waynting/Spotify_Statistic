import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  
  if (theme === 'system') {
    const isDark = getSystemTheme()
    root.classList.toggle('dark', isDark)
    return isDark
  } else {
    const isDark = theme === 'dark'
    root.classList.toggle('dark', isDark)
    return isDark
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isDark: false,
      
      setTheme: (theme: Theme) => {
        const isDark = applyTheme(theme)
        set({ theme, isDark })
      },
      
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        const isDark = applyTheme(newTheme)
        set({ theme: newTheme, isDark })
      }
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on load and listen to system theme changes
if (typeof window !== 'undefined') {
  // Initialize theme on page load
  const { theme, setTheme } = useThemeStore.getState()
  setTheme(theme)
  
  // Listen to system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const { theme: currentTheme, setTheme } = useThemeStore.getState()
    if (currentTheme === 'system') {
      setTheme('system') // Re-apply system theme
    }
  })
}