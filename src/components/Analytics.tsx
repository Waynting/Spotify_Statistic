import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, RefreshCw, BarChart as BarChartIcon, PieChart as PieChartIcon, Headphones, Music } from 'lucide-react'
import { dataService } from '../lib/data-service'
import { 
  AnalyticsTrackData, 
  AnalyticsAlbumData, 
  AnalyticsArtistData, 
  AnalyticsGenreData, 
  TimeSegmentData 
} from '../types/spotify'
import { shouldRetry, getRetryDelay, shouldRetryForTimeSegments } from './analytics/utils'
import DataSourceIndicator from './analytics/DataSourceIndicator'
import ErrorDisplay from './analytics/ErrorDisplay'
import TimeWindowSelector from './analytics/TimeWindowSelector'
import { TimeWindowOption } from './analytics/AnalyticsTypes'

// Analysis rendering components (would be split into separate files)
import AlbumsAnalysis from './analytics/AlbumsAnalysis'
import TracksAnalysis from './analytics/TracksAnalysis'
import ArtistsAnalysis from './analytics/ArtistsAnalysis'
import GenresAnalysis from './analytics/GenresAnalysis'
import TimeSegmentAnalysis from './analytics/TimeSegmentAnalysis'

const TIME_WINDOWS: TimeWindowOption[] = [
  { value: '7d', label: '一週', description: '過去七天' },
  { value: '30d', label: '一個月', description: '過去三十天' },
  { value: '180d', label: '180天', description: '過去六個月' },
  { value: '365d', label: '365天', description: '過去一年' },
]

const ANALYSIS_TYPES = [
  { value: 'albums', label: '專輯分析', icon: BarChartIcon },
  { value: 'tracks', label: '歌曲分析', icon: Headphones },
  { value: 'artists', label: '藝人分析', icon: Music },
  { value: 'genres', label: '曲風分析', icon: PieChartIcon },
  { value: 'timeSegments', label: '時間分析', icon: BarChartIcon },
]

export default function Analytics() {
  const [selectedWindow, setSelectedWindow] = useState('30d')
  const [selectedAnalysis, setSelectedAnalysis] = useState('albums')
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
  const [isTimeWindowMenuOpen, setIsTimeWindowMenuOpen] = useState(false)
  
  const analysisMenuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (analysisMenuRef.current && !analysisMenuRef.current.contains(event.target as Node)) {
        setIsAnalysisMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get regular analytics data
  const { 
    data: analyticsData, 
    isLoading: isAnalyticsLoading, 
    error: analyticsError, 
    refetch: refetchAnalytics 
  } = useQuery({
    queryKey: ['analytics', selectedWindow, selectedAnalysis],
    queryFn: () => dataService.getAnalyticsData(selectedWindow, selectedAnalysis),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    retryDelay: getRetryDelay,
    enabled: selectedAnalysis !== 'timeSegments'
  })

  // Get time segment data separately
  const { 
    data: timeSegmentData, 
    isLoading: isTimeSegmentLoading, 
    error: timeSegmentError, 
    refetch: refetchTimeSegment 
  } = useQuery({
    queryKey: ['timeSegmentAnalysis', selectedWindow],
    queryFn: () => dataService.getTimeSegmentAnalysis(selectedWindow),
    retry: (failureCount, error) => shouldRetryForTimeSegments(error, failureCount),
    retryDelay: getRetryDelay,
    enabled: selectedAnalysis === 'timeSegments'
  })

  const currentData = selectedAnalysis === 'timeSegments' ? timeSegmentData?.data : analyticsData?.data
  const isLoading = selectedAnalysis === 'timeSegments' ? isTimeSegmentLoading : isAnalyticsLoading
  const error = selectedAnalysis === 'timeSegments' ? timeSegmentError : analyticsError
  const sourceInfo = selectedAnalysis === 'timeSegments' ? timeSegmentData?.sourceInfo : analyticsData?.sourceInfo

  const safeCurrentData = Array.isArray(currentData) ? currentData : []

  const refetch = () => {
    if (selectedAnalysis === 'timeSegments') {
      refetchTimeSegment()
    } else {
      refetchAnalytics()
    }
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />
  }

  // Show loading or no data state
  if (isLoading || !safeCurrentData.length) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">載入音樂數據中...</p>
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
        return <AlbumsAnalysis data={safeCurrentData as AnalyticsAlbumData[]} selectedWindow={selectedWindow} />
      case 'tracks':
        return <TracksAnalysis data={safeCurrentData as AnalyticsTrackData[]} selectedWindow={selectedWindow} />
      case 'artists':
        return <ArtistsAnalysis data={safeCurrentData as AnalyticsArtistData[]} selectedWindow={selectedWindow} />
      case 'genres':
        return <GenresAnalysis data={safeCurrentData as AnalyticsGenreData[]} />
      case 'timeSegments':
        return <TimeSegmentAnalysis data={safeCurrentData as TimeSegmentData[]} />
      default:
        return <AlbumsAnalysis data={safeCurrentData as AnalyticsAlbumData[]} selectedWindow={selectedWindow} />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              音樂數據分析
            </h1>
            <p className="text-sm sm:text-base text-gray-400">探索你的音樂世界，發現聆聽偏好</p>
          </div>
          
          <button
            onClick={() => refetch()}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">更新資料</span>
            <span className="sm:hidden">更新</span>
          </button>
        </div>

        {/* Analysis Type Selector */}
        <div className="mb-8">
          <div className="hidden sm:flex flex-wrap gap-3">
            {ANALYSIS_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedAnalysis(type.value)}
                  className={`
                    px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3
                    ${selectedAnalysis === type.value
                      ? 'bg-white text-black shadow-lg transform scale-105'
                      : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="font-medium">{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mobile dropdown */}
          <div className="sm:hidden relative" ref={analysisMenuRef}>
            <button
              onClick={() => setIsAnalysisMenuOpen(!isAnalysisMenuOpen)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentType = ANALYSIS_TYPES.find(t => t.value === selectedAnalysis)
                    const Icon = currentType?.icon || BarChartIcon
                    return <Icon className="w-5 h-5" />
                  })()}
                  <span className="font-medium">
                    {ANALYSIS_TYPES.find(t => t.value === selectedAnalysis)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isAnalysisMenuOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </button>

            {isAnalysisMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {ANALYSIS_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedAnalysis(type.value)
                        setIsAnalysisMenuOpen(false)
                      }}
                      className={`
                        w-full p-3 text-left hover:bg-gray-800 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl
                        ${selectedAnalysis === type.value ? 'bg-gray-800' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-300" />
                        <span className="font-medium text-white">{type.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Data Source Indicator */}
        {sourceInfo && (
          <div className="mb-6 flex justify-center">
            <DataSourceIndicator sourceInfo={sourceInfo} />
          </div>
        )}

        {/* Time Window Selector - Show for all analysis types */}
        <TimeWindowSelector
          selectedWindow={selectedWindow}
          onWindowChange={setSelectedWindow}
          isMenuOpen={isTimeWindowMenuOpen}
          onMenuToggle={() => setIsTimeWindowMenuOpen(!isTimeWindowMenuOpen)}
          timeWindows={TIME_WINDOWS}
        />

        {/* Main Content */}
        {renderMainContent()}
      </div>
    </div>
  )
}