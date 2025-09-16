import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Mic, Play, Clock, Users, Star } from 'lucide-react'
import { AnalyticsArtistData } from '../../types/spotify'
import { formatTimeByWindow } from './utils'
import StatsCard from './StatsCard'

interface ArtistsAnalysisProps {
  data: AnalyticsArtistData[]
  selectedWindow: string
}

export default function ArtistsAnalysis({ data, selectedWindow }: ArtistsAnalysisProps) {
  const topArtists = data.slice(0, 8)
  const totalPlays = data.reduce((sum, artist) => sum + artist.plays, 0)
  const totalMinutes = data.reduce((sum, artist) => sum + (artist.minutes || 0), 0)
  const timeInfo = formatTimeByWindow(totalMinutes, selectedWindow)
  const avgPopularity = Math.round(data.reduce((sum, artist) => sum + artist.popularity, 0) / data.length)

  const chartData = topArtists.map(artist => ({
    name: artist.name.length > 12 ? artist.name.substring(0, 12) + '...' : artist.name,
    plays: artist.plays,
    minutes: artist.minutes || 0
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Mic}
          title="藝人總數"
          value={data.length.toString()}
          subtitle="不同藝人"
          color="text-pink-400"
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

      {/* Top Artists Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">熱門藝人播放次數</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Bar dataKey="plays" fill="#EC4899" name="plays" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">藝人排行榜</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topArtists.map((artist, index) => (
            <div key={artist.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                  #{index + 1}
                </div>
                {artist.imageUrl && (
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                  />
                )}
                <h4 className="font-medium text-white text-sm mb-1 truncate">{artist.name}</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center justify-center gap-1">
                    <Play size={12} />
                    <span>{artist.plays} 次播放</span>
                  </div>
                  {artist.minutes && (
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={12} />
                      <span>{artist.minutes} 分鐘</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1">
                    <Users size={12} />
                    <span>{(artist.followers || 0).toLocaleString()} 追蹤</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} />
                    <span>熱度 {artist.popularity}</span>
                  </div>
                </div>
                {artist.genres?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {artist.genres.slice(0, 2).map((genre) => (
                      <span key={genre} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}