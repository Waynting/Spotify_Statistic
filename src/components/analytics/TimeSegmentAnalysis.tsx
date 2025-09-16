import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Clock, Play, Volume2, Star, Sun, Sunset, Moon, Sunrise } from 'lucide-react'
import { TimeSegmentData } from '../../types/spotify'
import StatsCard from './StatsCard'

// 陽光主題配色：從清晨到夜晚的太陽光譜
const COLORS = {
  morning: '#FFB74D',    // 清晨陽光 - 溫暖金色
  afternoon: '#FDD835',  // 正午陽光 - 明亮黃色
  evening: '#FF7043',    // 夕陽西下 - 橙紅色
  night: '#7986CB'       // 星月夜空 - 柔和紫藍
}

// 根據時間段順序的顏色陣列
const COLOR_ARRAY = [COLORS.morning, COLORS.afternoon, COLORS.evening, COLORS.night]

// 時間段對應的圖示和主題
const getTimeSegmentTheme = (segment: string) => {
  switch (segment) {
    case 'morning':
      return { icon: Sunrise, color: COLORS.morning, name: '清晨陽光' }
    case 'afternoon': 
      return { icon: Sun, color: COLORS.afternoon, name: '正午陽光' }
    case 'evening':
      return { icon: Sunset, color: COLORS.evening, name: '夕陽西下' }
    case 'night':
      return { icon: Moon, color: COLORS.night, name: '星月夜空' }
    default:
      return { icon: Clock, color: COLORS.morning, name: '時間段' }
  }
}

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
          icon={Sun}
          title="時間段"
          value="4個"
          subtitle="分析區間"
          color="text-yellow-400"
        />
        <StatsCard
          icon={Play}
          title="總播放次數"
          value={totalTracks.toString()}
          color="text-orange-400"
        />
        <StatsCard
          icon={Sunset}
          title="活躍時段"
          value={peakSegment.label.split(' ')[0]}
          subtitle={`${peakSegment.percentage}%`}
          color="text-red-400"
        />
        <StatsCard
          icon={Star}
          title="平均分佈"
          value={Math.round(totalTracks / 4).toString()}
          subtitle="每時段"
          color="text-purple-400"
        />
      </div>

      {/* Time Distribution Chart */}
      <div className="bg-black border border-gray-800 rounded-xl p-6">
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
                  <Cell key={`cell-${index}`} fill={COLOR_ARRAY[index % COLOR_ARRAY.length]} />
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
        {data.map((segment, index) => {
          const theme = getTimeSegmentTheme(segment.segment)
          const IconComponent = theme.icon
          
          return (
            <div key={segment.segment} className="bg-black border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: theme.color + '20', color: theme.color }}>
                  <IconComponent size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{segment.label}</h3>
                  <p className="text-xs text-gray-400">{theme.name}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: theme.color }}>
                  {segment.percentage}%
                </span>
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
          )
        })}
      </div>
    </div>
  )
}