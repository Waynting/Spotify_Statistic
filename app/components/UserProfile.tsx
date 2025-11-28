'use client'

import React, { useEffect, useState } from 'react'
import { spotifyWebAPI } from '@/lib/spotify-web-api'
import { useAuthStore } from '@/store/useAuthStore'
import { User, MapPin, Crown, Music, Loader2 } from 'lucide-react'

interface UserData {
  id: string
  display_name: string
  email: string
  images: Array<{ url: string; height: number; width: number }>
  product: string
  country: string
}

export default function UserProfile() {
  const { isAuthenticated } = useAuthStore()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      // Check actual authentication state, not just store state
      if (!isAuthenticated || !spotifyWebAPI.isAuthenticated()) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await spotifyWebAPI.getCurrentUser()
        // Convert SpotifyUser to UserData format
        const userData: UserData = {
          id: data.id,
          display_name: data.display_name || data.id, // Fallback to id if display_name is null
          email: data.email || '',
          images: (data.images || []).map(img => ({
            url: img.url,
            height: img.height || 0,
            width: img.width || 0
          })),
          product: data.product || 'free',
          country: data.country || ''
        }
        setUserData(userData)
        setError(null)
      } catch (err) {
        // Only log error if actually authenticated (avoid noise during auth flow)
        if (spotifyWebAPI.isAuthenticated()) {
          console.error('Failed to fetch user data:', err)
          setError('無法載入用戶資料')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-spotify-green" />
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-6">
        <p className="text-gray-400 text-center">{error || '無法載入用戶資料'}</p>
      </div>
    )
  }

  const userImage = userData.images?.[0]?.url

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 md:p-6 mb-6 border border-gray-700">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* 用戶頭像 */}
        <div className="flex-shrink-0">
          {userImage ? (
            <img
              src={userImage}
              alt={userData.display_name}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-spotify-green shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-spotify-green shadow-lg">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* 用戶資訊 */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
            {userData.display_name}
            {userData.product === 'premium' && (
              <span className="bg-spotify-green text-black px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <Crown size={12} />
                PREMIUM
              </span>
            )}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 justify-center md:justify-start">
            <span className="flex items-center gap-1">
              <Music size={14} aria-hidden="true" />
              {userData.id}
            </span>
            
            {userData.country && (
              <span className="flex items-center gap-1">
                <MapPin size={14} aria-hidden="true" />
                {userData.country}
              </span>
            )}
            
            {userData.product && (
              <span className="capitalize">
                {userData.product === 'premium' ? '付費會員' : '免費會員'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}