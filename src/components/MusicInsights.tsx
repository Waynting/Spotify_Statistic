import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dataService } from '../lib/data-service'
import { spotifyWebAPI } from '../lib/spotify-web-api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Area, ComposedChart
} from 'recharts'
import { 
  Zap, TrendingUp, Music2, Mic2, Clock, Calendar, 
  Activity, Target, Award, Sparkles 
} from 'lucide-react'

interface ArtistData {
  id: string
  name: string
  genres: string[]
  popularity: number
  images: Array<{ url: string }>
}

export default function MusicInsights({ timeWindow }: { timeWindow: string }) {
  // 獲取專輯數據
  const { data: albums = [] } = useQuery({
    queryKey: ['albums', timeWindow],
    queryFn: () => dataService.getTopAlbums(timeWindow),
    staleTime: 5 * 60 * 1000,
  })

  // 獲取熱門藝人數據
  const { data: topArtists } = useQuery({
    queryKey: ['topArtists', timeWindow],
    queryFn: async () => {
      if (!spotifyWebAPI.isAuthenticated()) return null
      const timeRange = timeWindow === '7d' ? 'short_term' : 
                       timeWindow === '365d' ? 'long_term' : 'medium_term'
      return spotifyWebAPI.getTopArtists(timeRange, 10)
    },
    staleTime: 5 * 60 * 1000,
    enabled: spotifyWebAPI.isAuthenticated(),
  })

  // 分析聆聽模式
  const listeningPatterns = useMemo(() => {
    if (!albums.length) return null

    // 按小時分組播放時間（模擬數據）
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      plays: Math.floor(Math.random() * 20) + 5,
      energy: 0.3 + (Math.sin(hour / 3) + 1) * 0.35,
    }))

    // 按星期分組
    const weeklyData = [
      { day: '週一', plays: 45, mood: 0.6 },
      { day: '週二', plays: 38, mood: 0.5 },
      { day: '週三', plays: 52, mood: 0.7 },
      { day: '週四', plays: 61, mood: 0.8 },
      { day: '週五', plays: 89, mood: 0.9 },
      { day: '週六', plays: 95, mood: 0.95 },
      { day: '週日', plays: 72, mood: 0.85 },
    ]

    return { hourlyData, weeklyData }
  }, [albums])

  // 音樂品味雷達圖數據
  const tasteProfile = useMemo(() => {
    return [
      { attribute: '流行度', value: 75, fullMark: 100 },
      { attribute: '能量', value: 68, fullMark: 100 },
      { attribute: '舞蹈性', value: 82, fullMark: 100 },
      { attribute: '氛圍', value: 45, fullMark: 100 },
      { attribute: '原聲', value: 30, fullMark: 100 },
      { attribute: '現場感', value: 55, fullMark: 100 },
    ]
  }, [])

  // 聆聽成就
  const achievements = useMemo(() => {
    const totalPlays = albums.reduce((sum, album) => sum + album.plays, 0)
    const totalMinutes = albums.reduce((sum, album) => sum + (album.minutes || 0), 0)
    const uniqueAlbums = albums.length

    return [
      {
        icon: Activity,
        title: '活躍聆聽者',
        description: `${totalPlays} 次播放`,
        color: 'from-blue-500 to-blue-600',
        achieved: totalPlays > 100,
      },
      {
        icon: Clock,
        title: '時光旅行者',
        description: `${Math.round(totalMinutes / 60)} 小時`,
        color: 'from-purple-500 to-purple-600',
        achieved: totalMinutes > 600,
      },
      {
        icon: Target,
        title: '探索者',
        description: `${uniqueAlbums} 張專輯`,
        color: 'from-green-500 to-green-600',
        achieved: uniqueAlbums > 20,
      },
      {
        icon: Award,
        title: '忠實粉絲',
        description: '連續聆聽 30 天',
        color: 'from-orange-500 to-orange-600',
        achieved: timeWindow === '30d' || timeWindow === '180d' || timeWindow === '365d',
      },
    ]
  }, [albums, timeWindow])

  if (!listeningPatterns) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 聆聽成就 */}
      <section className="bg-gray-900 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="text-white" size={24} />
          聆聽成就
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon
            return (
              <div
                key={index}
                className={`relative overflow-hidden rounded-lg p-4 ${
                  achievement.achieved 
                    ? `bg-gradient-to-br ${achievement.color} text-white` 
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                <Icon size={24} className="mb-2" />
                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                <p className="text-xs opacity-90">{achievement.description}</p>
                {achievement.achieved && (
                  <Sparkles 
                    size={40} 
                    className="absolute -right-2 -top-2 opacity-20" 
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 每日聆聽模式 */}
      <section className="bg-gray-900 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="text-gray-400" size={24} />
          每日聆聽模式
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={listeningPatterns.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF" 
                tick={{ fontSize: 10 }}
                interval={2}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9CA3AF" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF" 
                tick={{ fontSize: 12 }}
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="plays" 
                fill="#1DB954" 
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="energy" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-spotify-green rounded" />
            播放次數
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded" />
            能量指數
          </span>
        </div>
      </section>

      {/* 音樂品味雷達圖 */}
      <section className="bg-gray-900 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="text-gray-400" size={24} />
          音樂品味分析
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={tasteProfile}>
              <PolarGrid 
                stroke="#374151" 
                radialLines={true}
              />
              <PolarAngleAxis 
                dataKey="attribute" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                stroke="#374151"
                tick={{ fontSize: 10 }}
              />
              <Radar 
                name="你的品味" 
                dataKey="value" 
                stroke="#1DB954" 
                fill="#1DB954" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 每週聆聽趨勢 */}
      <section className="bg-gray-900 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="text-gray-400" size={24} />
          每週聆聽趨勢
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={listeningPatterns.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value: any, name: string) => [
                  name === 'plays' ? `${value} 次` : `${(value * 100).toFixed(0)}%`,
                  name === 'plays' ? '播放次數' : '心情指數'
                ]}
              />
              <Bar 
                dataKey="plays" 
                fill="#1DB954" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 熱門藝人 */}
      {topArtists && topArtists.items.length > 0 && (
        <section className="bg-gray-900 rounded-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mic2 className="text-gray-400" size={24} />
            你的熱門藝人
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topArtists.items.slice(0, 5).map((artist: ArtistData, index: number) => (
              <div key={artist.id} className="text-center group">
                <div className="relative mb-2">
                  {artist.images[0] ? (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      className="w-full aspect-square rounded-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-full bg-gray-700 flex items-center justify-center">
                      <Mic2 size={32} className="text-gray-500" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <p className="text-sm font-semibold text-white truncate">{artist.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {artist.genres[0] || '未知風格'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}