import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Disc, Play, Clock, Volume2, Music } from 'lucide-react'
import { AnalyticsAlbumData } from '../../types/spotify'
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
          color="text-purple-400"
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
          color="text-blue-400"
        />
        <StatsCard
          icon={Volume2}
          title="最愛專輯"
          value={mostPlayedAlbum ? mostPlayedAlbum.plays.toString() : '0'}
          subtitle={mostPlayedAlbum ? "次播放" : "無數據"}
          color="text-green-400"
        />
      </div>

      {/* Top Albums Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">熱門專輯播放次數</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">專輯排行榜</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topAlbums.map((album, index) => (
            <div key={album.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{album.album_name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{album.artist}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{album.plays} 次播放</span>
                    <span>{Math.round(album.minutes)} 分鐘</span>
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