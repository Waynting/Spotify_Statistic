import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { spotifyApi } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import { Play, Clock, Info } from 'lucide-react'

const timeWindows = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '一個月' },
  { value: '90d', label: '3個月' },
  { value: '180d', label: '半年' },
  { value: '365d', label: '一年' },
]

export default function Shelf() {
  const [timeWindow, setTimeWindow] = useState('30d')
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const { data: albums, isLoading, error } = useQuery({
    queryKey: ['topAlbums', timeWindow],
    queryFn: () => spotifyApi.data.queryTopAlbumsWindow(timeWindow),
    retry: 1, // Only retry once to avoid long loading times
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handlePlayAlbum = async (albumId: string) => {
    if (!isAuthenticated) {
      if (confirm('需要連接 Spotify 才能播放音樂。現在前往設定頁面嗎？')) {
        navigate('/settings')
      }
      return
    }
    
    // For web version, open Spotify web player
    const spotifyUrl = `https://open.spotify.com/album/${albumId}`
    const newWindow = window.open(spotifyUrl, '_blank')
    if (!newWindow) {
      alert('請允許彈出視窗以開啟 Spotify')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">唱片櫃</h1>
        
        <div className="flex gap-2">
          {timeWindows.map((tw) => (
            <button
              key={tw.value}
              onClick={() => setTimeWindow(tw.value)}
              className={`pill ${timeWindow === tw.value ? 'active' : ''}`}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading && (
        <div className="text-center py-12 text-gray-400">載入中...</div>
      )}
      
      {error && (
        <div className="text-center py-12">
          <div className="bg-gray-900 rounded-lg p-6 inline-block">
            <p className="text-yellow-400 font-medium mb-2">無法載入音樂資料</p>
            <p className="text-gray-400 text-sm mb-4">請確認已連接 Spotify</p>
            <button
              onClick={() => (window as any).location.reload()}
              className="btn btn-secondary"
            >
              重新載入
            </button>
          </div>
        </div>
      )}
      
      {albums && Array.isArray(albums) && albums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => (
            <div
              key={album.album_id}
              className="card group relative"
              onClick={() => handlePlayAlbum(album.album_id)}
            >
              {/* Album Cover Placeholder */}
              <div className="aspect-square bg-gray-800 rounded-md mb-3 flex items-center justify-center text-gray-600">
                <span className="text-4xl">💿</span>
              </div>
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white" fill="currentColor" />
              </div>
              
              {/* Album Info */}
              <h3 className="font-semibold truncate">{album.album_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{album.plays} 次播放</span>
                {album.minutes && (
                  <>
                    <span>•</span>
                    <Clock size={14} />
                    <span>{Math.round(album.minutes)} 分鐘</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading && !error && isAuthenticated && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-semibold mb-2 text-white">沒有專輯資料</h2>
          <p className="text-gray-400">在選擇的時間範圍內沒有找到專輯資料</p>
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mt-8 bg-gray-900 rounded-lg p-4 flex items-start gap-3">
          <Info className="text-blue-400 mt-1" size={20} />
          <div className="text-sm">
            <p className="text-gray-300 font-medium">需要 Spotify 連接</p>
            <p className="text-gray-400 mt-1">
              請先
              <button
                onClick={() => navigate('/settings')}
                className="text-white hover:underline ml-1"
              >
                連接 Spotify
              </button>
              以查看你的聆聽記錄。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}