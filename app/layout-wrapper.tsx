'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Library, BarChart3, Folders, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { spotifyWebAPI } from '@/lib/spotify-web-api'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuthStatus } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Restore auth state from localStorage on mount
  // Skip on /callback page to avoid interfering with OAuth flow
  useEffect(() => {
    if (pathname !== '/callback') {
      checkAuthStatus()
    }
  }, [checkAuthStatus, pathname])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const navItems = [
    { to: '/analytics', icon: BarChart3, label: '數據分析', ariaLabel: '前往數據分析頁面' },
    { to: '/albums', icon: Library, label: '唱片櫃', ariaLabel: '前往唱片櫃頁面' },
    { to: '/crates', icon: Folders, label: '數據快照', ariaLabel: '前往數據快照頁面' },
    { to: '/settings', icon: SettingsIcon, label: '設定', ariaLabel: '前往設定頁面' },
  ]

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Mobile menu button - 只在菜单关闭时显示 */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="開啟導航選單"
          aria-expanded={false}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 border-r border-gray-800 p-4 lg:p-6
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button - 只在菜单打开时显示 */}
        <div className="lg:hidden flex justify-end mb-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉導航選單"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-white">
            Spotify Crate
          </h1>
          <div className="mt-1">
            <p className="text-xs text-gray-400">
              {isAuthenticated ? 'Spotify 已連接' : '未連接 Spotify'}
            </p>
          </div>
        </div>
        
        <nav className="space-y-2" role="navigation" aria-label="主導航">
          {navItems.map(({ to, icon: Icon, label, ariaLabel }) => {
            const isActive = pathname === to
            return (
              <Link
                key={to}
                href={to}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px]
                  ${isActive 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
                aria-label={ariaLabel}
              >
                <Icon size={20} aria-hidden="true" className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>
        
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden lg:ml-0 min-w-0" role="main">
        <div className="lg:hidden h-16" aria-hidden="true" /> {/* Spacer for mobile menu button */}
        <div className="w-full max-w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  )
}

