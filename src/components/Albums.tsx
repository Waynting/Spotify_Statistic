import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dataService } from '../lib/data-service'
import { AlbumRow } from '../types'
import { Play, Clock, Calendar, Headphones, TrendingUp, RefreshCw, Loader2, Download, FileJson, FileText, FileSpreadsheet } from 'lucide-react'
import { exportToJSON, exportToCSV, generateMarkdownReport } from '../lib/export-utils'
import UserProfile from './UserProfile'
import SearchFilter from './SearchFilter'
import { TIME_WINDOWS, DEFAULT_TIME_WINDOW } from '../constants/timeWindows'

const sortOptions = [
  { value: 'plays', label: '播放次數' },
  { value: 'minutes', label: '聆聽時長' },
  { value: 'recent', label: '最近播放' },
]

export default function Albums() {
  const [window, setWindow] = useState(DEFAULT_TIME_WINDOW)
  const [sortBy, setSortBy] = useState('plays')
  const [filteredAlbums, setFilteredAlbums] = useState<AlbumRow[]>([])
  
  const { data: albums, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['albums', window],
    queryFn: () => dataService.getTopAlbums(window),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // 根據選擇的排序方式排序數據 - 使用 useMemo 優化性能
  const sortedAlbums = useMemo(() => {
    const albumsToSort = filteredAlbums.length > 0 ? filteredAlbums : (albums || [])
    return [...albumsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'plays':
          return b.plays - a.plays
        case 'minutes':
          return (b.minutes || 0) - (a.minutes || 0)
        case 'recent':
          return (b.last_played || 0) - (a.last_played || 0)
        default:
          return 0
      }
    })
  }, [albums, filteredAlbums, sortBy])
  
  // 當原始專輯數據變化時，重置篩選結果
  useEffect(() => {
    if (albums && filteredAlbums.length === 0) {
      setFilteredAlbums(albums)
    }
  }, [albums, filteredAlbums.length])

  // 計算統計數據 - 使用 useMemo 優化性能
  const stats = useMemo(() => {
    if (!albums?.length) return null
    const totalPlays = albums.reduce((sum, album) => sum + album.plays, 0)
    const totalMinutes = albums.reduce((sum, album) => sum + (album.minutes || 0), 0)
    return {
      totalAlbums: albums.length,
      totalPlays,
      totalMinutes,
      avgPlaysPerAlbum: Math.round(totalPlays / albums.length),
    }
  }, [albums])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}小時${mins}分鐘` : `${mins}分鐘`
  }, [])

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])
  
  const handleExportJSON = useCallback(() => {
    if (!sortedAlbums.length) return
    
    const exportData = {
      albums: sortedAlbums,
      timeWindow: window,
      exportDate: new Date().toISOString(),
      totalPlays: stats?.totalPlays || 0,
      totalMinutes: stats?.totalMinutes || 0,
      totalAlbums: stats?.totalAlbums || 0
    }
    exportToJSON(exportData)
  }, [sortedAlbums, window, stats])
  
  const handleExportCSV = useCallback(() => {
    if (!sortedAlbums.length) return
    exportToCSV(sortedAlbums, window)
  }, [sortedAlbums, window])
  
  const handleExportMarkdown = useCallback(() => {
    if (!sortedAlbums.length || !stats) return
    
    const exportData = {
      albums: sortedAlbums,
      timeWindow: window,
      exportDate: new Date().toISOString(),
      totalPlays: stats.totalPlays,
      totalMinutes: stats.totalMinutes,
      totalAlbums: stats.totalAlbums
    }
    generateMarkdownReport(exportData)
  }, [sortedAlbums, window, stats])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">專輯聆聽分析</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">深入了解你的音樂品味和聆聽習慣</p>
      </div>

      {/* 用戶資料 */}
      <UserProfile />

      {/* 控制面板 */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 md:p-6 mb-8 transition-colors">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 whitespace-nowrap">
                <Calendar size={16} aria-hidden="true" />
                時間範圍:
              </span>
              <div className="flex gap-1" role="tablist" aria-label="時間範圍選擇">
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.value}
                    onClick={() => setWindow(tw.value)}
                    className={`pill transition-all duration-200 ${window === tw.value ? 'active' : ''}`}
                    role="tab"
                    aria-selected={window === tw.value}
                    aria-label={`選擇 ${tw.label} 時間範圍`}
                  >
                    {tw.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">排序:</span>
              <div className="flex gap-1" role="radiogroup" aria-label="排序方式選擇">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`pill transition-all duration-200 ${sortBy === option.value ? 'active' : ''}`}
                    role="radio"
                    aria-checked={sortBy === option.value}
                    aria-label={`按 ${option.label} 排序`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="btn btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                aria-label="重新載入數據"
              >
                {isFetching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                <span className="hidden sm:inline">重新載入</span>
              </button>
              
              {/* 匯出下拉選單 */}
              {sortedAlbums.length > 0 && (
                <div className="relative group">
                  <button
                    className="btn btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                    aria-label="匯出數據"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">匯出</span>
                  </button>
                  
                  <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 rounded-t-lg"
                    >
                      <FileJson size={14} />
                      匯出為 JSON
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <FileSpreadsheet size={14} />
                      匯出為 CSV
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 rounded-b-lg"
                    >
                      <FileText size={14} />
                      匯出為 Markdown
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 統計概覽 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" role="region" aria-label="統計概覽">
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg" aria-hidden="true">
                <Play className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-white" aria-label={`專輯總數 ${stats.totalAlbums}`}>
                  {stats.totalAlbums}
                </p>
                <p className="text-sm text-gray-400">專輯總數</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg" aria-hidden="true">
                <Headphones className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-white" aria-label={`總播放次數 ${stats.totalPlays.toLocaleString()}`}>
                  {stats.totalPlays.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">總播放次數</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg" aria-hidden="true">
                <Clock className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-white" aria-label={`總聆聽時長 ${formatDuration(stats.totalMinutes)}`}>
                  {formatDuration(stats.totalMinutes)}
                </p>
                <p className="text-sm text-gray-400">總聆聽時長</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg" aria-hidden="true">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-white" aria-label={`平均播放次數 ${stats.avgPlaysPerAlbum}`}>
                  {stats.avgPlaysPerAlbum}
                </p>
                <p className="text-sm text-gray-400">平均播放次數</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜尋與篩選 */}
      {albums && albums.length > 0 && (
        <SearchFilter 
          albums={albums} 
          onFilterChange={setFilteredAlbums}
        />
      )}

      {/* 載入狀態 */}
      {isLoading && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green" aria-hidden="true"></div>
          <p className="text-gray-400 mt-4">載入專輯數據中...</p>
          <div className="sr-only">正在載入專輯數據，請稍候</div>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center" role="alert">
          <p className="text-gray-400 mb-4">載入數據時發生錯誤</p>
          <p className="text-sm text-gray-400 mb-4">{error instanceof Error ? error.message : '未知錯誤'}</p>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            aria-label="重新載入專輯數據"
          >
            重新載入
          </button>
        </div>
      )}

      {/* 專輯列表 */}
      {sortedAlbums.length > 0 && (
        <div className="bg-gray-900 rounded-lg overflow-hidden" role="region" aria-label="專輯排行榜">
          <div className="p-4 md:p-6 border-b border-gray-800">
            <h2 className="text-lg md:text-xl font-semibold text-white">
              專輯排行榜 ({TIME_WINDOWS.find(w => w.value === window)?.label}) - 按{sortOptions.find(o => o.value === sortBy)?.label}排序
            </h2>
          </div>
          
          <div className="divide-y divide-gray-800" role="list">
            {sortedAlbums.map((album, index) => (
              <div
                key={album.album_id}
                className="p-4 md:p-6 hover:bg-gray-800/50 transition-all duration-200 group focus-within:bg-gray-800/50"
                role="listitem"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  {/* 排名 */}
                  <div className="flex-shrink-0 w-8 md:w-12 text-center">
                    <span className="text-lg md:text-2xl font-bold text-gray-500 group-hover:text-gray-400 transition-colors" aria-label={`第 ${index + 1} 名`}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  {/* 專輯封面 */}
                  <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-lg overflow-hidden" aria-hidden="true">
                    {album.album_image ? (
                      <img 
                        src={album.album_image} 
                        alt={`${album.album_name} 封面`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl md:text-2xl">💿</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 專輯信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate text-base md:text-lg" title={album.album_name}>
                      {album.album_name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1" aria-label={`播放次數: ${album.plays}`}>
                        <Headphones size={14} aria-hidden="true" />
                        {album.plays} 次播放
                      </span>
                      {album.minutes && (
                        <span className="flex items-center gap-1" aria-label={`聆聽時長: ${formatDuration(album.minutes)}`}>
                          <Clock size={14} aria-hidden="true" />
                          {formatDuration(album.minutes)}
                        </span>
                      )}
                      {album.last_played && (
                        <span className="flex items-center gap-1" aria-label={`最後播放: ${formatDate(album.last_played)}`}>
                          <Calendar size={14} aria-hidden="true" />
                          {formatDate(album.last_played)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 播放按鈕 */}
                  <button 
                    className="flex-shrink-0 p-2 md:p-3 rounded-full bg-gray-800 hover:bg-spotify-green hover:text-black transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-label={`播放 ${album.album_name}`}
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 空狀態 */}
      {!isLoading && !error && sortedAlbums.length === 0 && (
        <div className="text-center py-12" role="status">
          <div className="text-6xl mb-4" aria-hidden="true">🎵</div>
          <h3 className="text-xl font-semibold text-white mb-2">沒有找到專輯數據</h3>
          <p className="text-gray-400 mb-4">嘗試切換不同的時間範圍，或連接你的 Spotify 帳號</p>
          <button
            onClick={handleRefresh}
            className="btn btn-primary"
            aria-label="重新載入數據"
          >
            重新載入
          </button>
        </div>
      )}
    </div>
  )
}