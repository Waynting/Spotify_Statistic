import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Disc, Play, Clock, Volume2, Music } from 'lucide-react'
import { AnalyticsAlbumData } from '@/types/spotify'
import { formatTimeByWindow } from './utils'
import StatsCard from './StatsCard'

interface AlbumsAnalysisProps {
  data: AnalyticsAlbumData[]
  selectedWindow: string
}

export default function AlbumsAnalysis({ data, selectedWindow }: AlbumsAnalysisProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-20">
        <Music size={64} className="mx-auto mb-4 text-gray-500" />
        <h2 className="text-2xl font-semibold mb-2 text-white">沒有專輯數據</h2>
        <p className="text-gray-400">選擇的時間範圍內沒有找到專輯數據</p>
      </div>
    )
  }

  const topAlbums = data.slice(0, 6)
  const totalPlays = data.reduce((sum, album) => sum + album.plays, 0)
  const totalMinutes = data.reduce((sum, album) => sum + album.minutes, 0)
  const timeInfo = formatTimeByWindow(totalMinutes, selectedWindow)
  const mostPlayedAlbum = data[0]

  const chartData = topAlbums.map(album => ({
    name: album.album_name.length > 20 ? album.album_name.substring(0, 20) + '...' : album.album_name,
    plays: album.plays,
    minutes: Math.round(album.minutes)
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Disc}
          title="專輯總數"
          value={data.length.toString()}
          subtitle="不同專輯"
          color="text-gray-300"
        />
        <StatsCard
          icon={Play}
          title="總播放次數"
          value={totalPlays.toString()}
          color="text-white"
        />
        <StatsCard
          icon={Clock}
          title="總聆聽時間"
          value={timeInfo.value}
          subtitle={timeInfo.subtitle}
          color="text-gray-400"
        />
        <StatsCard
          icon={Volume2}
          title="最愛專輯"
          value={mostPlayedAlbum ? mostPlayedAlbum.plays.toString() : '0'}
          subtitle={mostPlayedAlbum ? "次播放" : "無數據"}
          color="text-gray-500"
        />
      </div>

      {/* Top Albums Chart */}
      <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">熱門專輯播放次數</h3>
        <div className="h-64 sm:h-80 min-w-[400px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 10 }}
                width={60}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value, name) => [
                  name === 'plays' ? `${value} 次播放` : `${value} 分鐘`,
                  name === 'plays' ? '播放次數' : '聆聽時間'
                ]}
              />
              <Bar dataKey="plays" fill="#8B5CF6" name="plays" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Albums Grid */}
      <div className="bg-black border border-gray-800 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">專輯排行榜</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {topAlbums.map((album, index) => (
            <div key={album.id} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800 transition-colors group">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Album Cover */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg overflow-hidden">
                    {album.album_image ? (
                      <img 
                        src={album.album_image} 
                        alt={album.album_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling!.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-gray-500 ${album.album_image ? 'hidden' : ''}`}>
                      <Disc size={20} className="sm:w-6 sm:h-6" />
                    </div>
                  </div>
                  {/* Ranking badge */}
                  <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold">
                    {index + 1}
                  </div>
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" />
                  </div>
                </div>
                
                {/* Album Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2" title={album.album_name}>{album.album_name}</h4>
                  <p className="text-xs text-gray-400 mb-2 truncate" title={album.artist}>{album.artist}</p>
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Play size={12} className="flex-shrink-0" />
                      <span>{album.plays} 次播放</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="flex-shrink-0" />
                      <span>{Math.round(album.minutes)} 分鐘</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}