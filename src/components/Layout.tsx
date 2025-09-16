import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Library, BarChart3, Folders, Settings as SettingsIcon, Wifi, WifiOff, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { spotifyApi } from '../lib/api'
import { ModeToggle } from './mode-toggle'

export default function Layout() {
  const { isAuthenticated } = useAuthStore()
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    // Check backend connectivity
    const checkBackend = async () => {
      try {
        await spotifyApi.data.queryTopAlbumsWindow('7d')
        setBackendStatus('connected')
      } catch (error) {
        setBackendStatus('disconnected')
      }
    }
    
    checkBackend()
  }, [])
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const navItems = [
    { to: '/albums', icon: Library, label: '專輯分析', ariaLabel: '前往專輯分析頁面' },
    { to: '/analytics', icon: BarChart3, label: '數據概覽', ariaLabel: '前往數據概覽頁面' },
    { to: '/crates', icon: Folders, label: '收納夾', ariaLabel: '前往收納夾頁面' },
    { to: '/settings', icon: SettingsIcon, label: '設定', ariaLabel: '前往設定頁面' },
  ]

  return (
    <div className="flex h-screen bg-background transition-colors">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="切換導航選單"
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

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
        w-64 bg-card border-r border-border p-4 lg:p-6
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-white">
            Spotify Crate
          </h1>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {isAuthenticated ? '已連接' : '離線'}
            </p>
            <div className="flex items-center gap-1" role="status" aria-label="連線狀態">
              {backendStatus === 'connected' ? (
                <>
                  <Wifi size={12} className="text-white" aria-hidden="true" />
                  <span className="sr-only">已連線</span>
                </>
              ) : backendStatus === 'disconnected' ? (
                <>
                  <WifiOff size={12} className="text-gray-500" aria-hidden="true" />
                  <span className="sr-only">未連線</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse" aria-hidden="true" />
                  <span className="sr-only">連線中</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <nav className="space-y-2" role="navigation" aria-label="主導航">
          {navItems.map(({ to, icon: Icon, label, ariaLabel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-accent text-accent-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`
              }
              aria-label={ariaLabel}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Theme Toggle at bottom of sidebar */}
        <div className="absolute bottom-4 left-4 right-4">
          <ModeToggle />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0" role="main">
        <div className="lg:hidden h-16" aria-hidden="true" /> {/* Spacer for mobile menu button */}
        <Outlet />
      </main>
    </div>
  )
}