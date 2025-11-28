import { Suspense } from 'react'
import SpotifyCallback from '../components/SpotifyCallback'

function CallbackLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green mb-4"></div>
        <p className="text-gray-400">正在處理 Spotify 認證...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <SpotifyCallback />
    </Suspense>
  )
}

