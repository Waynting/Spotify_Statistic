import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Radio, TrendingUp, Zap, Star } from 'lucide-react'
import { AnalyticsGenreData } from '../../types/spotify'
import StatsCard from './StatsCard'

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316']

interface GenresAnalysisProps {
  data: AnalyticsGenreData[]
}

export default function GenresAnalysis({ data }: GenresAnalysisProps) {
  const topGenres = data.slice(0, 8)
  const totalCount = data.reduce((sum, genre) => sum + genre.count, 0)
  const mostPopularGenre = data[0]
  const diversityScore = Math.min(100, Math.round((data.length / 20) * 100))

  const pieData = topGenres.map(genre => ({
    name: genre.name,
    value: genre.count,
    percentage: genre.percentage
  }))

  const barData = topGenres.map(genre => ({
    name: genre.name.length > 12 ? genre.name.substring(0, 12) + '...' : genre.name,
    count: genre.count,
    percentage: genre.percentage
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard
          icon={Radio}
          title="曲風總數"
          value={data.length.toString()}
          subtitle="不同曲風"
          color="text-orange-400"
        />
        <StatsCard
          icon={TrendingUp}
          title="最愛曲風"
          value={mostPopularGenre ? mostPopularGenre.name : '無'}
          subtitle={mostPopularGenre ? `${mostPopularGenre.percentage}%` : '無數據'}
          color="text-white"
        />
        <StatsCard
          icon={Zap}
          title="音樂多樣性"
          value={`${diversityScore}%`}
          subtitle="曲風豐富度"
          color="text-purple-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">曲風分佈圓餅圖</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
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
                  formatter={(value, name) => [`${value} 次`, '出現次數']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">熱門曲風排行</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11 }}
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
                    name === 'count' ? `${value} 次` : `${value}%`,
                    name === 'count' ? '出現次數' : '百分比'
                  ]}
                />
                <Bar dataKey="count" fill="#F59E0B" name="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Genres List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">完整曲風清單</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.slice(0, 20).map((genre, index) => (
            <div key={genre.name} className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white text-sm font-medium truncate">{genre.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{genre.percentage}%</div>
                  <div className="text-gray-400 text-xs">{genre.count} 次</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {data.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">還有 {data.length - 20} 個曲風...</p>
          </div>
        )}
      </div>
    </div>
  )
}