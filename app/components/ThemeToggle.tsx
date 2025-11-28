import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, changeTheme } = useTheme()

  const themes = [
    { value: 'light', label: '淺色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '系統', icon: Monitor },
  ] as const

  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg transition-colors">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.value
          
          return (
            <button
              key={themeOption.value}
              onClick={() => changeTheme(themeOption.value)}
              className={`
                p-2 rounded-md transition-all duration-200 flex items-center gap-2
                ${isActive 
                  ? 'bg-spotify-green text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                }
              `}
              title={themeOption.label}
            >
              <Icon size={16} />
              <span className="text-sm font-medium hidden sm:inline">
                {themeOption.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}