import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Smartphone, Speaker, Monitor, RefreshCw } from 'lucide-react'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { spotifyWebAPI } from '@/lib/spotify-web-api'

export default function SpotifyPlayer() {
  const {
    devices,
    currentDevice,
    playbackState,
    isLoading,
    transferPlayback,
    play,
    pause,
    next,
    previous,
    refresh
  } = useSpotifyPlayer()

  if (!spotifyWebAPI.isAuthenticated()) {
    return (
      <div className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-center">
          請先連接 Spotify 帳號以使用播放控制功能
        </p>
      </div>
    )
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'smartphone':
        return <Smartphone size={16} />
      case 'computer':
        return <Monitor size={16} />
      default:
        return <Speaker size={16} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Playing */}
      {playbackState?.item && (
        <div className="bg-gray-900 dark:bg-gray-900 light:bg-white light:border light:border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            {playbackState.item.album.images[0] && (
              <img
                src={playbackState.item.album.images[0].url}
                alt={playbackState.item.album.name}
                className="w-16 h-16 rounded-md"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white dark:text-white light:text-gray-900 truncate">
                {playbackState.item.name}
              </h3>
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 truncate">
                {playbackState.item.artists.map(artist => artist.name).join(', ')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500 truncate">
                {playbackState.item.album.name}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={previous}
                disabled={!playbackState.actions.skipping_prev}
                className="p-2 rounded-full bg-gray-800 dark:bg-gray-800 light:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack size={16} />
              </button>
              
              <button
                onClick={playbackState.is_playing ? pause : () => play()}
                disabled={playbackState.is_playing ? !playbackState.actions.pausing : !playbackState.actions.resuming}
                className="p-3 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {playbackState.is_playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={next}
                disabled={!playbackState.actions.skipping_next}
                className="p-2 rounded-full bg-gray-800 dark:bg-gray-800 light:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {playbackState.progress_ms !== null && playbackState.item.duration_ms && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                <span>
                  {Math.floor(playbackState.progress_ms / 60000)}:
                  {String(Math.floor((playbackState.progress_ms % 60000) / 1000)).padStart(2, '0')}
                </span>
                <div className="flex-1 bg-gray-700 dark:bg-gray-700 light:bg-gray-300 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(playbackState.progress_ms / playbackState.item.duration_ms) * 100}%`
                    }}
                  />
                </div>
                <span>
                  {Math.floor(playbackState.item.duration_ms / 60000)}:
                  {String(Math.floor((playbackState.item.duration_ms % 60000) / 1000)).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Devices */}
      <div className="bg-gray-900 dark:bg-gray-900 light:bg-white light:border light:border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white dark:text-white light:text-gray-900">
            播放裝置
          </h3>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
            沒有找到可用的播放裝置。請開啟 Spotify 應用程式。
          </p>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => !device.is_active && transferPlayback(device.id)}
                disabled={isLoading}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                  ${device.is_active 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="text-gray-300">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{device.name}</p>
                  <p className="text-sm opacity-75 capitalize">{device.type}</p>
                </div>
                {device.is_active && (
                  <div className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                    目前裝置
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}