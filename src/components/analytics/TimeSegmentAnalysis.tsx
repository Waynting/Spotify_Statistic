import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Clock, Play, Volume2, Star } from 'lucide-react'
import { TimeSegmentData } from '../../types/spotify'
import StatsCard from './StatsCard'

const COLORS = ['#FBBF24', '#F59E0B', '#1F2937', '#374151']

interface TimeSegmentAnalysisProps {
  data: TimeSegmentData[]
}

export default function TimeSegmentAnalysis({ data }: TimeSegmentAnalysisProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock size={64} className="mx-auto mb-4 text-gray-500" />
        <h2 className="text-2xl font-semibold mb-2 text-white">沒有時間段數據</h2>
        <p className="text-gray-400">需要更多聆聽記錄來分析時間段偏好</p>
      </div>
    )
  }

  const totalTracks = data.reduce((sum, segment) => sum + segment.totalTracks, 0)
  const peakSegment = data.reduce((max, segment) => 
    segment.totalTracks > max.totalTracks ? segment : max, data[0]
  )

  const pieData = data.map(segment => ({
    name: segment.label.split(' ')[0], // Get just the time part like "早上"
    value: segment.totalTracks,
    percentage: segment.percentage,
    fullLabel: segment.label
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          title="時間段"
          value="4個"
          subtitle="分析區間"
          color="text-orange-400"
        />
        <StatsCard
          icon={Play}
          title="總播放次數"
          value={totalTracks.toString()}
          color="text-white"
        />
        <StatsCard
          icon={Volume2}
          title="活躍時段"
          value={peakSegment.label.split(' ')[0]}
          subtitle={`${peakSegment.percentage}%`}
          color="text-gray-400"
        />
        <StatsCard
          icon={Star}
          title="平均分佈"
          value={Math.round(totalTracks / 4).toString()}
          subtitle="每時段"
          color="text-gray-400"
        />
      </div>

      {/* Time Distribution Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">時間段聆聽分佈</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value, name, props) => [
                  `${value} 首歌曲 (${props.payload.percentage}%)`,
                  props.payload.fullLabel
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Segments Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((segment, index) => (
          <div key={segment.segment} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <h3 className="text-lg font-semibold text-white">{segment.label}</h3>
              <span className="text-sm text-gray-400">({segment.percentage}%)</span>
            </div>
            
            <div className="mb-4">
              <p className="text-2xl font-bold text-white">{segment.totalTracks}</p>
              <p className="text-sm text-gray-400">首歌曲</p>
            </div>

            {segment.topArtists && Array.isArray(segment.topArtists) && segment.topArtists.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">熱門藝人</h4>
                <div className="space-y-1">
                  {segment.topArtists.slice(0, 3).map((artist) => (
                    <div key={artist.name} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 truncate">{artist.name}</span>
                      <span className="text-white ml-2">{artist.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}