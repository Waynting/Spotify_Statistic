import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'system'
  })

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const root = document.documentElement
    
    const updateTheme = () => {
      let newTheme: 'light' | 'dark'
      
      if (theme === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        newTheme = theme
      }
      
      setActualTheme(newTheme)
      
      // Remove both classes first
      root.classList.remove('dark', 'light')
      
      // Add the appropriate class
      root.classList.add(newTheme)
    }

    updateTheme()
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return {
    theme,
    actualTheme,
    changeTheme,
    isDark: actualTheme === 'dark'
  }
}