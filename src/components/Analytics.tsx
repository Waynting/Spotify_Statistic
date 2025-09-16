import React, { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dataService } from '../lib/data-service'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import { 
  TrendingUp, Music, Clock, Calendar, Users, Star, RefreshCw, Loader2, 
  Headphones, Disc, Mic, Radio, Wifi, WifiOff, AlertTriangle, Play, Heart,
  Trophy, Zap, TrendingDown, Volume2, Timer
} from 'lucide-react'
import { 
  AnalyticsTrackData, 
  AnalyticsAlbumData, 
  AnalyticsArtistData, 
  AnalyticsGenreData, 
  TimeSegmentData,
  DataSourceInfo,
  AnalyticsResponse
} from '../types/spotify'

const timeWindows = [
  { value: '7d', label: '7天', description: '最近一週' },
  { value: '30d', label: '30天', description: '過去一個月' },
  { value: '90d', label: '90天', description: '過去三個月' },
  { value: '180d', label: '180天', description: '過去半年' },
  { value: '365d', label: '365天', description: '過去一年' },
]

const COLORS = ['#1DB954', '#1ed760', '#1fdf64', '#65d97b', '#8ae99c', '#a3ecb8', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']

const analysisTypes = [
  { 
    id: 'albums', 
    label: '專輯分析', 
    icon: Disc, 
    description: '你最愛的專輯排行',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'tracks', 
    label: '單曲分析', 
    icon: Headphones, 
    description: '最常播放的歌曲',
    color: 'from-green-500 to-blue-500'
  },
  { 
    id: 'artists', 
    label: '藝人分析', 
    icon: Mic, 
    description: '你的音樂偶像們',
    color: 'from-orange-500 to-red-500'
  },
  { 
    id: 'genres', 
    label: '曲風分析', 
    icon: Radio, 
    description: '音樂風格偏好',
    color: 'from-indigo-500 to-purple-500'
  },
  { 
    id: 'timeSegments', 
    label: '時間分析', 
    icon: Clock, 
    description: '不同時段的音樂偏好',
    color: 'from-yellow-500 to-orange-500'
  },
]

export default function Analytics() {
  const [selectedWindow, setSelectedWindow] = useState('30d')
  const [selectedAnalysis, setSelectedAnalysis] = useState('albums') // 默認顯示專輯

  // 獲取常規分析數據
  const { data: analyticsResponse, isLoading: isLoadingAnalytics, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics', selectedWindow, selectedAnalysis],
    queryFn: () => dataService.getAnalyticsData(selectedWindow, selectedAnalysis),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: selectedAnalysis !== 'timeSegments'
  })

  // 獲取時間段分析數據
  const { data: timeSegmentResponse, isLoading: isLoadingTimeSegment, error: timeSegmentError, refetch: refetchTimeSegment } = useQuery({
    queryKey: ['timeSegments'],
    queryFn: () => dataService.getTimeSegmentAnalysis(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: selectedAnalysis === 'timeSegments'
  })

  // 選擇當前數據和狀態
  const isLoading = selectedAnalysis === 'timeSegments' ? isLoadingTimeSegment : isLoadingAnalytics
  const error = selectedAnalysis === 'timeSegments' ? timeSegmentError : analyticsError
  const refetch = selectedAnalysis === 'timeSegments' ? refetchTimeSegment : refetchAnalytics
  const currentResponse = selectedAnalysis === 'timeSegments' ? timeSegmentResponse : analyticsResponse

  // 提取數據和來源信息
  const currentData = currentResponse?.data || []
  const sourceInfo = currentResponse?.sourceInfo
  
  // 處理數據為空的情況
  const safeCurrentData = currentData || []

  // 獲取當前分析類型配置
  const currentAnalysisConfig = analysisTypes.find(type => type.id === selectedAnalysis)

  // 數據來源指示組件
  const DataSourceIndicator = ({ sourceInfo }: { sourceInfo?: DataSourceInfo }) => {
    if (!sourceInfo) return null
    
    const getSourceIcon = () => {
      switch (sourceInfo.source) {
        case 'spotify':
          return <Wifi size={14} className="text-green-400" />
        case 'demo':
          return <AlertTriangle size={14} className="text-amber-400" />
        case 'cache':
          return <Zap size={14} className="text-blue-400" />
        default:
          return <WifiOff size={14} className="text-gray-400" />
      }
    }

    const getSourceText = () => {
      switch (sourceInfo.source) {
        case 'spotify':
          return '即時資料'
        case 'demo':
          return '範例資料'
        case 'cache':
          return '快取資料'
        default:
          return '未知來源'
      }
    }

    const getSourceColor = () => {
      switch (sourceInfo.source) {
        case 'spotify':
          return 'bg-green-500/10 border-green-500/20 text-green-300'
        case 'demo':
          return 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        case 'cache':
          return 'bg-blue-500/10 border-blue-500/20 text-blue-300'
        default:
          return 'bg-gray-500/10 border-gray-500/20 text-gray-400'
      }
    }

    return (
      <div className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border ${getSourceColor()}`}>
        {getSourceIcon()}
        <span className="font-medium">{getSourceText()}</span>
        {sourceInfo.source === 'demo' && (
          <span className="opacity-75">• 連接 Spotify 查看個人數據</span>
        )}
      </div>
    )
  }

  // 統計卡片組件
  const StatsCard = ({ icon: Icon, title, value, subtitle, trend, color = "text-gray-400" }: {
    icon: any, title: string, value: string, subtitle?: string, trend?: 'up' | 'down' | 'stable', color?: string
  }) => (
    <div className="bg-black border border-gray-800 rounded-xl p-4 hover:bg-gray-900 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`${color} w-5 h-5`} />
        {trend && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-white' : 
            trend === 'down' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                音樂數據分析
              </h1>
              <p className="text-gray-400 mt-2">探索你的音樂世界</p>
            </div>
          </div>

          {/* Loading State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-gray-700 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-400 mt-4 text-lg">正在分析你的音樂品味...</p>
            <p className="text-gray-500 mt-2 text-sm">這可能需要幾秒鐘時間</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">載入失敗</h2>
            <p className="text-gray-400 mb-6">無法載入分析數據，請稍後再試</p>
            <button
              onClick={() => refetch()}
              className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderMainContent = () => {
    if (!safeCurrentData.length) {
      return (
        <div className="text-center py-20">
          <Music size={64} className="mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-semibold mb-2 text-white">沒有數據</h2>
          <p className="text-gray-400">選擇的時間範圍內沒有找到數據</p>
        </div>
      )
    }

    switch (selectedAnalysis) {
      case 'albums':
        return renderAlbumsAnalysis()
      case 'tracks':
        return renderTracksAnalysis()
      case 'artists':
        return renderArtistsAnalysis()
      case 'genres':
        return renderGenresAnalysis()
      case 'timeSegments':
        return renderTimeSegmentAnalysis()
      default:
        return renderAlbumsAnalysis()
    }
  }

  const renderAlbumsAnalysis = () => {
    const albums = safeCurrentData as AnalyticsAlbumData[]
    const topAlbums = albums.slice(0, 6)
    const totalPlays = albums.reduce((sum, album) => sum + album.plays, 0)
    const totalMinutes = albums.reduce((sum, album) => sum + album.minutes, 0)
    
    // Statistics are dynamically calculated based on current data
    // Data updates automatically when selectedWindow or selectedAnalysis changes

    return (
      <div className="space-y-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={Disc}
            title="專輯總數"
            value={albums.length.toString()}
            subtitle="在選定時間內"
            color="text-gray-400"
          />
          <StatsCard
            icon={Play}
            title="總播放次數"
            value={totalPlays.toLocaleString()}
            subtitle="所有專輯合計"
            trend="up"
            color="text-white"
          />
          <StatsCard
            icon={Timer}
            title="聆聽時長"
            value={`${Math.round(totalMinutes / 60)}小時`}
            subtitle={`${totalMinutes}分鐘`}
            color="text-gray-400"
          />
          <StatsCard
            icon={Heart}
            title="平均播放"
            value={Math.round(totalPlays / albums.length).toString()}
            subtitle="每張專輯"
            color="text-gray-300"
          />
        </div>

        {/* Top Albums Grid */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              熱門專輯排行榜
            </h3>
            <DataSourceIndicator sourceInfo={sourceInfo} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topAlbums.map((album, index) => (
              <div
                key={album.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-gray-300 text-black' : 
                      index === 2 ? 'bg-amber-600 text-white' : 
                      'bg-gray-600 text-white'}
                  `}>
                    {index + 1}
                  </div>
                  {album.album_image && (
                    <img 
                      src={album.album_image} 
                      alt={album.album_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                </div>
                
                <h4 className="font-semibold text-white mb-1 group-hover:text-gray-300 transition-colors">
                  {album.album_name}
                </h4>
                <p className="text-gray-400 text-sm mb-3">{album.artist}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-white">
                    <Play size={14} />
                    <span className="font-medium">{album.plays}</span>
                  </div>
                  <div className="text-gray-400">
                    {Math.round(album.minutes)}分鐘
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Albums Chart */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart className="text-blue-400" size={20} />
            播放次數分析
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAlbums} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="album_name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Bar dataKey="plays" fill="#1DB954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderTracksAnalysis = () => {
    const tracks = safeCurrentData as AnalyticsTrackData[]
    const topTracks = tracks.slice(0, 10)
    const totalPlays = tracks.reduce((sum, track) => sum + track.plays, 0)
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0)

    return (
      <div className="space-y-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={Headphones}
            title="單曲總數"
            value={tracks.length.toString()}
            color="text-white"
          />
          <StatsCard
            icon={Play}
            title="總播放次數"
            value={totalPlays.toLocaleString()}
            trend="up"
            color="text-gray-400"
          />
          <StatsCard
            icon={Timer}
            title="總時長"
            value={`${totalDuration}分鐘`}
            color="text-gray-400"
          />
          <StatsCard
            icon={Star}
            title="平均熱度"
            value={Math.round(tracks.reduce((sum, t) => sum + t.popularity, 0) / tracks.length).toString()}
            color="text-gray-300"
          />
        </div>

        {/* Top Tracks List */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              熱門單曲排行榜
            </h3>
            <DataSourceIndicator sourceInfo={sourceInfo} />
          </div>
          
          <div className="space-y-3">
            {topTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-yellow-500 text-black' : 
                    index === 1 ? 'bg-gray-300 text-black' : 
                    index === 2 ? 'bg-amber-600 text-white' : 
                    'bg-gray-600 text-white'}
                `}>
                  {index + 1}
                </div>
                
                {track.imageUrl && (
                  <img 
                    src={track.imageUrl} 
                    alt={track.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1 truncate group-hover:text-gray-300 transition-colors">
                    {track.name}
                  </h4>
                  <p className="text-gray-400 text-sm truncate">{track.artist} • {track.album}</p>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1 text-green-400">
                    <Play size={14} />
                    <span className="font-medium">{track.plays}</span>
                  </div>
                  <div className="text-gray-400">
                    {track.duration}分鐘
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-gray-300">{track.popularity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Chart */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart className="text-blue-400" size={20} />
            播放次數分析
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTracks} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Bar dataKey="plays" fill="#1DB954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderArtistsAnalysis = () => {
    const artists = safeCurrentData as AnalyticsArtistData[]
    const topArtists = artists.slice(0, 8)
    const totalPlays = artists.reduce((sum, artist) => sum + artist.plays, 0)
    const totalMinutes = artists.reduce((sum, artist) => sum + (artist.minutes || 0), 0)

    return (
      <div className="space-y-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={Mic}
            title="藝人總數"
            value={artists.length.toString()}
            color="text-gray-400"
          />
          <StatsCard
            icon={Play}
            title="總播放次數"
            value={totalPlays.toLocaleString()}
            trend="up"
            color="text-white"
          />
          <StatsCard
            icon={Timer}
            title="總播放時長"
            value={`${Math.round(totalMinutes / 60)}小時`}
            subtitle={`${totalMinutes}分鐘`}
            color="text-gray-400"
          />
          <StatsCard
            icon={Heart}
            title="平均播放"
            value={Math.round(totalPlays / artists.length).toString()}
            subtitle="每位藝人"
            color="text-gray-300"
          />
        </div>

        {/* Top Artists Grid */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-yellow-400" size={24} />
              熱門藝人排行榜
            </h3>
            <DataSourceIndicator sourceInfo={sourceInfo} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topArtists.map((artist, index) => (
              <div
                key={artist.id}
                className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-yellow-500 text-black' : 
                    index === 1 ? 'bg-gray-300 text-black' : 
                    index === 2 ? 'bg-amber-600 text-white' : 
                    'bg-gray-600 text-white'}
                `}>
                  {index + 1}
                </div>
                
                {artist.imageUrl && (
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1 truncate group-hover:text-gray-300 transition-colors">
                    {artist.name}
                  </h4>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {artist.genres.slice(0, 2).map((genre, i) => (
                      <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Play size={12} />
                      <span>{artist.plays}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{(artist.followers / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} />
                      <span>{artist.popularity}</span>
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

  const renderGenresAnalysis = () => {
    const genres = safeCurrentData as AnalyticsGenreData[]
    const topGenres = genres.slice(0, 8)
    const totalTracks = genres.reduce((sum, genre) => sum + genre.count, 0)

    return (
      <div className="space-y-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatsCard
            icon={Radio}
            title="音樂風格"
            value={genres.length.toString()}
            subtitle="種類"
            color="text-indigo-400"
          />
          <StatsCard
            icon={Music}
            title="歌曲總數"
            value={totalTracks.toString()}
            color="text-gray-400"
          />
          <StatsCard
            icon={Heart}
            title="最愛風格"
            value={genres[0]?.name || 'Unknown'}
            subtitle={`${genres[0]?.percentage || 0}%`}
            color="text-gray-300"
          />
        </div>

        {/* Genres Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Genre List */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="text-indigo-400" size={20} />
                音樂風格分佈
              </h3>
              <DataSourceIndicator sourceInfo={sourceInfo} />
            </div>
            
            <div className="space-y-3">
              {topGenres.map((genre, index) => (
                <div key={genre.name} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white capitalize">{genre.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{genre.count} 首歌</span>
                      <span>•</span>
                      <span>{genre.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${genre.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-black border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <PieChart className="text-purple-400" size={20} />
              風格比例圖
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topGenres}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {topGenres.map((entry, index) => (
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
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTimeSegmentAnalysis = () => {
    const segments = safeCurrentData as TimeSegmentData[]
    
    if (!segments.length) {
      return (
        <div className="text-center py-20">
          <Clock size={64} className="mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-semibold mb-2 text-white">沒有時間段數據</h2>
          <p className="text-gray-400">需要更多聆聽記錄來分析時間段偏好</p>
        </div>
      )
    }

    const totalTracks = segments.reduce((sum, segment) => sum + segment.totalTracks, 0)
    const peakSegment = segments.reduce((max, segment) => 
      segment.totalTracks > max.totalTracks ? segment : max, segments[0]
    )

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
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart className="text-blue-400" size={20} />
              時間段聆聽分佈
            </h3>
            <DataSourceIndicator sourceInfo={sourceInfo} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Bar dataKey="totalTracks" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Segments Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {segments.map((segment) => (
            <div key={segment.segment} className="bg-black border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">{segment.label}</h4>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-400">{segment.totalTracks}</div>
                  <div className="text-sm text-gray-400">{segment.percentage}% 播放</div>
                </div>
              </div>
              
              {segment.topArtists.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3 text-sm text-gray-400">熱門藝術家</h5>
                  <div className="space-y-2">
                    {segment.topArtists.map((artist, index) => (
                      <div key={artist.name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-white">{artist.name}</span>
                        <span className="text-sm text-gray-400">{artist.count} 次</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="text-purple-400" size={20} />
            時間段偏好分析
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="totalTracks"
                  nameKey="label"
                  label={({ label, percentage }) => `${label}: ${percentage}%`}
                >
                  {segments.map((entry, index) => (
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
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              音樂數據分析
            </h1>
            <p className="text-gray-400">探索你的音樂世界，發現聆聽偏好</p>
          </div>
          
          <button
            onClick={() => refetch()}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            更新資料
          </button>
        </div>

        {/* Analysis Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedAnalysis(type.id)}
              className={`
                relative p-4 rounded-xl transition-all duration-200 group overflow-hidden
                ${selectedAnalysis === type.id 
                  ? 'bg-white text-black shadow-lg transform scale-105' 
                  : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                }
              `}
            >
              <div className="relative z-10">
                <type.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium text-sm">{type.label}</div>
                <div className={`text-xs mt-1 ${
                  selectedAnalysis === type.id ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {type.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Time Window Selector - 只有非時間段分析才顯示 */}
        {selectedAnalysis !== 'timeSegments' && (
          <div className="flex flex-wrap gap-3 mb-8">
            {timeWindows.map((window) => (
              <button
                key={window.value}
                onClick={() => setSelectedWindow(window.value)}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-200 text-sm
                  ${selectedWindow === window.value
                    ? 'bg-white text-black shadow-lg transform scale-105'
                    : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                  }
                `}
              >
                <div className="font-medium">{window.label}</div>
                <div className="text-xs opacity-75">{window.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        {renderMainContent()}
      </div>
    </div>
  )
}