import React, { useState, useCallback, useEffect } from 'react'
import { Search, Filter, X, Music, Calendar, TrendingUp } from 'lucide-react'
import { AlbumRow } from '../types'

interface SearchFilterProps {
  albums: AlbumRow[]
  onFilterChange: (filtered: AlbumRow[]) => void
}

export default function SearchFilter({ albums, onFilterChange }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minPlays: 0,
    maxPlays: Infinity,
    minMinutes: 0,
    maxMinutes: Infinity,
    dateRange: 'all' as 'all' | 'week' | 'month' | 'year'
  })

  // 應用篩選
  useEffect(() => {
    let filtered = [...albums]

    // 搜尋篩選
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(album => 
        album.album_name.toLowerCase().includes(search)
      )
    }

    // 播放次數篩選
    filtered = filtered.filter(album => 
      album.plays >= filters.minPlays && 
      album.plays <= (filters.maxPlays || Infinity)
    )

    // 聆聽時長篩選
    filtered = filtered.filter(album => 
      (album.minutes || 0) >= filters.minMinutes && 
      (album.minutes || 0) <= (filters.maxMinutes || Infinity)
    )

    // 日期範圍篩選
    if (filters.dateRange !== 'all' && albums.some(a => a.last_played)) {
      const now = Date.now()
      const ranges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      }
      const cutoff = now - ranges[filters.dateRange]
      
      filtered = filtered.filter(album => 
        !album.last_played || album.last_played >= cutoff
      )
    }

    onFilterChange(filtered)
  }, [searchTerm, filters, albums, onFilterChange])

  const handleReset = useCallback(() => {
    setSearchTerm('')
    setFilters({
      minPlays: 0,
      maxPlays: Infinity,
      minMinutes: 0,
      maxMinutes: Infinity,
      dateRange: 'all'
    })
  }, [])

  const activeFiltersCount = [
    filters.minPlays > 0,
    filters.maxPlays < Infinity,
    filters.minMinutes > 0,
    filters.maxMinutes < Infinity,
    filters.dateRange !== 'all'
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* 搜尋欄 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋專輯名稱..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-spotify-green transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="清除搜尋"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-secondary flex items-center gap-2 relative ${
            showFilters ? 'bg-spotify-green text-black' : ''
          }`}
          aria-label="切換篩選選項"
        >
          <Filter size={16} />
          篩選
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 篩選面板 */}
      {showFilters && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">進階篩選</h3>
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-white"
            >
              重設
            </button>
          </div>

          {/* 播放次數範圍 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <TrendingUp size={16} />
              播放次數範圍
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                value={filters.minPlays}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minPlays: parseInt(e.target.value) || 0 
                }))}
                placeholder="最少"
                className="w-24 px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-spotify-green text-sm"
              />
              <span className="text-gray-400">至</span>
              <input
                type="number"
                min="0"
                value={filters.maxPlays === Infinity ? '' : filters.maxPlays}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxPlays: parseInt(e.target.value) || Infinity 
                }))}
                placeholder="最多"
                className="w-24 px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-spotify-green text-sm"
              />
              <span className="text-gray-400 text-sm">次</span>
            </div>
          </div>

          {/* 聆聽時長範圍 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <Music size={16} />
              聆聽時長範圍
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                value={filters.minMinutes}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minMinutes: parseInt(e.target.value) || 0 
                }))}
                placeholder="最少"
                className="w-24 px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-spotify-green text-sm"
              />
              <span className="text-gray-400">至</span>
              <input
                type="number"
                min="0"
                value={filters.maxMinutes === Infinity ? '' : filters.maxMinutes}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxMinutes: parseInt(e.target.value) || Infinity 
                }))}
                placeholder="最多"
                className="w-24 px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-spotify-green text-sm"
              />
              <span className="text-gray-400 text-sm">分鐘</span>
            </div>
          </div>

          {/* 最後播放日期 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar size={16} />
              最後播放時間
            </label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'week', label: '過去一週' },
                { value: 'month', label: '過去一個月' },
                { value: 'year', label: '過去一年' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: option.value as any }))}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filters.dateRange === option.value
                      ? 'bg-spotify-green text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 篩選結果統計 */}
          <div className="pt-2 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              找到 <span className="text-white font-semibold">{albums.length}</span> 張符合條件的專輯
            </p>
          </div>
        </div>
      )}
    </div>
  )
}