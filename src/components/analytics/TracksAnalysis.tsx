import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Headphones, Play, Clock, Star } from 'lucide-react'
import { AnalyticsTrackData } from '../../types/spotify'
import { formatTimeByWindow } from './utils'
import StatsCard from './StatsCard'

interface TracksAnalysisProps {
  data: AnalyticsTrackData[]
  selectedWindow: string
}

export default function TracksAnalysis({ data, selectedWindow }: TracksAnalysisProps) {
  const topTracks = data.slice(0, 10)
  const totalPlays = data.reduce((sum, track) => sum + track.plays, 0)
  const totalMinutes = data.reduce((sum, track) => sum + (track.duration * track.plays), 0)
  const timeInfo = formatTimeByWindow(totalMinutes, selectedWindow)
  const avgPopularity = Math.round(data.reduce((sum, track) => sum + track.popularity, 0) / data.length)

  const chartData = topTracks.map(track => ({
    name: track.name.length > 15 ? track.name.substring(0, 15) + '...' : track.name,
    plays: track.plays,
    popularity: track.popularity
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Headphones}
          title="歌曲總數"
          value={data.length.toString()}
          subtitle="不同歌曲"
          color="text-green-400"
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
          icon={Star}
          title="平均熱度"
          value={avgPopularity.toString()}
          subtitle="Spotify 評分"
          color="text-yellow-400"
        />
      </div>

      {/* Top Tracks Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">熱門歌曲播放次數</h3>
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
                  name === 'plays' ? `${value} 次播放` : `${value} 熱度`,
                  name === 'plays' ? '播放次數' : 'Spotify 熱度'
                ]}
              />
              <Bar dataKey="plays" fill="#10B981" name="plays" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tracks List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">歌曲排行榜</h3>
        <div className="space-y-3">
          {topTracks.map((track, index) => (
            <div key={track.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  #{index + 1}
                </div>
                {track.imageUrl && (
                  <img 
                    src={track.imageUrl} 
                    alt={track.album}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{track.name}</h4>
                  <p className="text-xs text-gray-400">{track.artist} • {track.album}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{track.plays} 次播放</span>
                    <span>{track.duration} 分鐘</span>
                    <span>熱度 {track.popularity}</span>
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