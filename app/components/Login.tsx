'use client'

import React, { useState } from 'react'
import { spotifyWebAPI } from '@/lib/spotify-web-api'
import { useAuthStore } from '@/store/useAuthStore'
import config from '@/lib/config'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)

  const handleLogin = async () => {
    try {
      setLoading(true)
      
      // Validate configuration
      if (!config.isConfigured()) {
        alert('請先設置有效的 Spotify Client ID')
        return
      }
      
      // Start OAuth flow - redirects to Spotify
      const authUrl = await spotifyWebAPI.startAuthFlow()
      // Redirect to Spotify for OAuth authorization
      window.location.href = authUrl
      
    } catch (error) {
      console.error('Login error:', error)
      alert('認證失敗: ' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 w-full max-w-full overflow-x-hidden">
      <div className="max-w-md w-full p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Spotify Crate</h1>
          <p className="text-sm sm:text-base text-gray-400">你的個人音樂資料庫與分析工具</p>
        </div>
        
        <div className="bg-black border border-gray-800 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">開始使用</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6">
            連接你的 Spotify 帳號來開始建立你的唱片櫃
          </p>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn btn-primary py-3 text-base sm:text-lg font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {loading ? '連接中...' : '連接 Spotify'}
          </button>
          
          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>這個應用程式需要存取你的 Spotify 資料</p>
            <p>我們不會儲存你的密碼</p>
          </div>
        </div>
      </div>
    </div>
  )
}