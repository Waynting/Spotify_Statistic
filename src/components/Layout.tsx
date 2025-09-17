import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Library, BarChart3, Folders, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function Layout() {
  const { isAuthenticated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const navItems = [
    { to: '/analytics', icon: BarChart3, label: '數據分析', ariaLabel: '前往數據分析頁面' },
    { to: '/albums', icon: Library, label: '唱片櫃', ariaLabel: '前往唱片櫃頁面' },
    { to: '/crates', icon: Folders, label: '數據快照', ariaLabel: '前往數據快照頁面' },
    { to: '/settings', icon: SettingsIcon, label: '設定', ariaLabel: '前往設定頁面' },
  ]

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
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
        w-64 bg-gray-900 border-r border-gray-800 p-4 lg:p-6
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
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
          {navItems.map(({ to, icon: Icon, label, ariaLabel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
              aria-label={ariaLabel}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0" role="main">
        <div className="lg:hidden h-16" aria-hidden="true" /> {/* Spacer for mobile menu button */}
        <Outlet />
      </main>
    </div>
  )
}