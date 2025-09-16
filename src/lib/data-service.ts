import { spotifyWebAPI } from './spotify-web-api'
import { AlbumRow } from '../types'
import {
  SpotifyTrack,
  SpotifyRecentlyPlayedTrack,
  SpotifyTopTracksResponse,
  SpotifyTopArtistsResponse,
  SpotifyArtist,
  SpotifyTimeRange,
  AnalyticsTrackData,
  AnalyticsAlbumData,
  AnalyticsArtistData,
  AnalyticsGenreData,
  TimeSegmentData,
  DataSourceInfo,
  AnalyticsResponse
} from '../types/spotify'
import { cacheManager } from './cache-manager'

interface SpotifyTrackAnalysis {
  trackId: string
  albumId: string
  albumName: string
  artistName: string
  albumImageUrl?: string
  playCount: number
  playTime: number // in seconds
  lastPlayed: number // timestamp
}

class DataService {
  // Helper method to create data source info
  private createSourceInfo(source: 'spotify' | 'cache'): DataSourceInfo {
    return {
      source,
      timestamp: Date.now(),
      isOnline: navigator.onLine,
      hasValidToken: spotifyWebAPI.isAuthenticated()
    }
  }

  private analyzeSpotifyData(tracks: (SpotifyTrack | SpotifyRecentlyPlayedTrack)[], type: 'top' | 'recent'): SpotifyTrackAnalysis[] {
    const trackMap = new Map<string, SpotifyTrackAnalysis>()
    
    tracks.forEach((item, index) => {
      const track = type === 'recent' ? (item as SpotifyRecentlyPlayedTrack).track : (item as SpotifyTrack)
      const playedAt = type === 'recent' ? new Date((item as SpotifyRecentlyPlayedTrack).played_at).getTime() : Date.now() - (index * 3600000)
      
      const albumId = track.album.id
      const key = `${albumId}`
      
      if (!trackMap.has(key)) {
        trackMap.set(key, {
          trackId: track.id,
          albumId: albumId,
          albumName: `${track.album.name} - ${track.album.artists[0]?.name || 'Unknown'}`,
          artistName: track.album.artists[0]?.name || 'Unknown',
          albumImageUrl: track.album.images?.[0]?.url,
          playCount: 0,
          playTime: 0,
          lastPlayed: playedAt
        })
      }
      
      const analysis = trackMap.get(key)!
      analysis.playCount += 1
      analysis.playTime += track.duration_ms / 1000
      analysis.lastPlayed = Math.max(analysis.lastPlayed, playedAt)
    })
    
    return Array.from(trackMap.values())
  }

  private convertToAlbumRows(analysis: SpotifyTrackAnalysis[], window: string): AlbumRow[] {
    // Apply window-specific multiplier to estimated plays
    const windowMultiplier = this.getWindowMultiplier(window)
    
    return analysis
      .sort((a, b) => b.playCount - a.playCount)
      .map((item, index) => {
        // Calculate window-adjusted plays
        const basePlayCount = item.playCount
        const rankingBonus = Math.max(1, 20 - index) // Top albums get bonus
        const adjustedPlays = Math.max(
          Math.round((basePlayCount * windowMultiplier) / 10 + rankingBonus),
          Math.round(basePlayCount * (windowMultiplier / 20)) // Minimum scaled plays
        )
        
        return {
          album_id: item.albumId,
          album_name: item.albumName,
          album_image: item.albumImageUrl,
          plays: adjustedPlays,
          minutes: Math.round((item.playTime / 60) * (windowMultiplier / 10) * 100) / 100,
          last_played: item.lastPlayed
        }
      })
  }

  public async getTopAlbums(window: string): Promise<AlbumRow[]> {
    console.log('🎵 DataService.getTopAlbums called with window:', window)
    console.log('🔐 Authentication status:', spotifyWebAPI.isAuthenticated())
    
    try {
      // 如果離線或 API 不可用，返回空陣列
      if (!spotifyWebAPI.isAuthenticated()) {
        console.log('⚠️ Not authenticated, returning empty data')
        return []
      }

      // Map time windows to Spotify time ranges using centralized method
      const timeRange = this.getSpotifyTimeRange(window)
      console.log(`📊 Mapped window "${window}" to timeRange "${timeRange}"`)

      // Get both top tracks and recent tracks for better analysis
      console.log('📡 Fetching data from Spotify API...')
      const [topTracks, recentTracks] = await Promise.all([
        spotifyWebAPI.getTopTracks(timeRange, 50).then(result => {
          console.log('✅ Top tracks fetched:', result.items?.length || 0, 'tracks')
          return result
        }),
        spotifyWebAPI.getRecentlyPlayed(50).then(result => {
          console.log('✅ Recent tracks fetched:', result.items?.length || 0, 'tracks')
          return result
        }).catch(error => {
          console.log('⚠️ Recent tracks failed:', error.message)
          return { items: [] }
        })
      ])

      // Analyze and combine data
      const topAnalysis = this.analyzeSpotifyData(topTracks.items, 'top')
      const recentAnalysis = this.analyzeSpotifyData(recentTracks.items, 'recent')

      // Merge analyses, prioritizing top tracks but including recent play data
      const mergedMap = new Map<string, SpotifyTrackAnalysis>()
      
      // Add top tracks first
      topAnalysis.forEach(analysis => {
        mergedMap.set(analysis.albumId, { ...analysis })
      })
      
      // Enhance with recent play data
      recentAnalysis.forEach(analysis => {
        const existing = mergedMap.get(analysis.albumId)
        if (existing) {
          // Update play counts and last played time
          existing.playCount = Math.max(existing.playCount, analysis.playCount)
          existing.lastPlayed = Math.max(existing.lastPlayed, analysis.lastPlayed)
        } else {
          // Add new albums from recent plays
          mergedMap.set(analysis.albumId, analysis)
        }
      })

      const result = this.convertToAlbumRows(Array.from(mergedMap.values()), window)
      console.log('📊 Processed albums:', result.length)
      
      // Apply time window filtering for recent data
      let filteredResult: AlbumRow[]
      if (window === '7d') {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        filteredResult = result
          .filter(album => (album.last_played || 0) > weekAgo)
          .slice(0, 15)
        console.log('📅 Filtered for 7d window:', filteredResult.length, 'albums')
      } else {
        filteredResult = result.slice(0, 15)
      }
      
      console.log('🎯 Final result:', filteredResult.length, 'albums')
      return filteredResult

    } catch (error) {
      console.error('❌ Failed to get Spotify data:', error)
      console.log('🔄 Returning empty data due to error')
      
      // 失敗時返回空陣列
      return []
    }
  }

  public async getUserProfile(): Promise<any> {
    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        return null
      }
      
      // This would require adding the user profile endpoint to spotifyWebAPI
      // For now, return null
      return null
    } catch (error) {
      console.warn('Failed to get user profile:', error)
      return null
    }
  }

  // 新增分析數據獲取方法
  public async getAnalyticsData(window: string, analysisType: string): Promise<AnalyticsResponse<AnalyticsTrackData | AnalyticsAlbumData | AnalyticsArtistData | AnalyticsGenreData>> {
    // Check cache first
    const cached = cacheManager.getCachedAnalytics(window, analysisType)
    if (cached) {
      return {
        ...cached,
        sourceInfo: { ...cached.sourceInfo, source: 'cache' }
      } as AnalyticsResponse<AnalyticsTrackData | AnalyticsAlbumData | AnalyticsArtistData | AnalyticsGenreData>
    }

    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        const response = {
          data: [],
          sourceInfo: this.createSourceInfo('spotify')
        }
        return response
      }

      let data: (AnalyticsTrackData | AnalyticsAlbumData | AnalyticsArtistData | AnalyticsGenreData)[]
      
      // 根據分析類型獲取不同的數據
      switch (analysisType) {
        case 'tracks':
          data = await this.getTracksAnalysis(window)
          break
        case 'albums':
          data = await this.getAlbumsAnalysis(window)
          break
        case 'artists':
          data = await this.getArtistsAnalysis(window)
          break
        case 'genres':
          data = await this.getGenresAnalysis(window)
          break
        default:
          data = await this.getTracksAnalysis(window)
      }
      
      const response = {
        data,
        sourceInfo: this.createSourceInfo('spotify')
      }
      
      // Cache real data for longer time
      cacheManager.cacheAnalytics(window, analysisType, response, 5 * 60 * 1000) // 5 minutes
      return response
      
    } catch (error) {
      console.warn('Failed to get analytics data:', error)
      const response = {
        data: [],
        sourceInfo: this.createSourceInfo('spotify')
      }
      return response
    }
  }

  private async getTracksAnalysis(window: string): Promise<AnalyticsTrackData[]> {
    const timeRange = this.getSpotifyTimeRange(window)
    
    try {
      // 獲取更多最近播放記錄以提供準確的播放次數
      const [topTracks, recentTracks] = await Promise.all([
        spotifyWebAPI.getTopTracks(timeRange, 50),
        // 嘗試獲取更多最近播放記錄
        Promise.all([
          spotifyWebAPI.getRecentlyPlayed(50).catch(() => ({ items: [] })),
          // 可以添加更多批次來獲取更多歷史記錄，但 Spotify API 限制為50條
        ]).then(results => ({
          items: results.flatMap(result => result.items)
        }))
      ])
      
      // 統計實際播放次數
      const playCountMap = new Map<string, number>()
      recentTracks.items.forEach(item => {
        const trackId = item.track.id
        playCountMap.set(trackId, (playCountMap.get(trackId) || 0) + 1)
      })
      
      return topTracks.items.map((track, index) => {
        // 使用實際播放次數，如果沒有記錄則根據排名和熱度估算
        let estimatedPlays = playCountMap.get(track.id)
        
        if (!estimatedPlays) {
          // 根據 top tracks 位置和 popularity 估算播放次數
          const rankingFactor = Math.max(1, 50 - index) // 排名越高，播放次數越多
          const popularityFactor = Math.max(1, Math.floor(track.popularity / 10)) // 熱度影響
          const windowMultiplier = this.getWindowMultiplier(window) / 4 // 時間窗口影響
          
          estimatedPlays = Math.max(
            Math.round(rankingFactor * popularityFactor * windowMultiplier),
            5 // 最少5次播放
          )
        }
        
        return {
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          album: track.album.name,
          plays: estimatedPlays,
          duration: Math.round(track.duration_ms / 1000 / 60), // 分鐘
          popularity: track.popularity,
          imageUrl: track.album.images?.[0]?.url
        }
      })
    } catch (error) {
      console.error('Error in getTracksAnalysis:', error)
      // 返回帶有估算播放次數的fallback數據
      const topTracks = await spotifyWebAPI.getTopTracks(timeRange, 50)
      return topTracks.items.map((track, index) => {
        const rankingFactor = Math.max(1, 50 - index)
        const windowMultiplier = this.getWindowMultiplier(window) / 4
        const estimatedPlays = Math.max(Math.round(rankingFactor * windowMultiplier), 5)
        
        return {
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          album: track.album.name,
          plays: estimatedPlays,
          duration: Math.round(track.duration_ms / 1000 / 60),
          popularity: track.popularity,
          imageUrl: track.album.images?.[0]?.url
        }
      })
    }
  }

  private async getAlbumsAnalysis(window: string): Promise<AnalyticsAlbumData[]> {
    // 使用現有的專輯分析邏輯並轉換為正確類型
    const albums = await this.getTopAlbums(window)
    const result = albums.map(album => ({
      id: album.album_id,
      album_name: album.album_name,
      artist: album.album_name.split(' - ')[1] || 'Unknown Artist',
      plays: album.plays || 0,
      minutes: album.minutes || 0,
      last_played: album.last_played || 0,
      album_image: album.album_image
    }))
    
    const totalPlays = result.reduce((sum, album) => sum + album.plays, 0)
    const totalMinutes = result.reduce((sum, album) => sum + album.minutes, 0)
    console.log(`📊 Albums analysis for "${window}": ${result.length} albums, ${totalPlays} total plays, ${totalMinutes} total minutes`)
    
    return result
  }

  private async getArtistsAnalysis(window: string): Promise<AnalyticsArtistData[]> {
    const timeRange = this.getSpotifyTimeRange(window)
    const windowMultiplier = this.getWindowMultiplier(window)
    
    const [topArtists, recentTracks] = await Promise.all([
      spotifyWebAPI.getTopArtists(timeRange, 50),
      spotifyWebAPI.getRecentlyPlayed(50).catch(() => ({ items: [] }))
    ])
    
    // 統計藝術家實際播放次數和時長
    const artistPlayCount = new Map<string, number>()
    const artistPlayTime = new Map<string, number>()
    
    recentTracks.items.forEach(item => {
      item.track.artists.forEach(artist => {
        artistPlayCount.set(artist.id, (artistPlayCount.get(artist.id) || 0) + 1)
        artistPlayTime.set(artist.id, (artistPlayTime.get(artist.id) || 0) + item.track.duration_ms / 1000 / 60)
      })
    })
    
    const result = topArtists.items.map((artist, index) => {
      const basePlayCount = artistPlayCount.get(artist.id) || 1
      const basePlayTime = artistPlayTime.get(artist.id) || 3 // 預設3分鐘
      const rankingBonus = Math.max(1, 50 - index)
      
      // 根據時間窗口調整播放次數和時長
      const adjustedPlays = Math.max(
        Math.round((basePlayCount * windowMultiplier) / 10 + rankingBonus),
        Math.round(basePlayCount * (windowMultiplier / 30))
      )
      
      const adjustedMinutes = Math.round(
        (basePlayTime * windowMultiplier) / 15 + (rankingBonus * 2)
      )
      
      return {
        id: artist.id,
        name: artist.name,
        genres: Array.isArray(artist.genres) ? artist.genres.slice(0, 3) : [],
        followers: artist.followers?.total || 0,
        popularity: artist.popularity,
        plays: adjustedPlays,
        minutes: adjustedMinutes,
        imageUrl: artist.images?.[0]?.url
      }
    })
    
    const totalPlays = result.reduce((sum, artist) => sum + artist.plays, 0)
    const totalMinutes = result.reduce((sum, artist) => sum + (artist.minutes || 0), 0)
    console.log(`📊 Artists analysis for "${window}": ${result.length} artists, ${totalPlays} total plays, ${totalMinutes} total minutes`)
    
    return result
  }

  private async getGenresAnalysis(window: string): Promise<AnalyticsGenreData[]> {
    const timeRange = this.getSpotifyTimeRange(window)
    const [topTracks, topArtists] = await Promise.all([
      spotifyWebAPI.getTopTracks(timeRange, 50),
      spotifyWebAPI.getTopArtists(timeRange, 50)
    ])

    // 統計曲風
    const genreCount = new Map<string, number>()
    
    // 從歌手的曲風中統計
    topArtists.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount.set(genre, (genreCount.get(genre) || 0) + 1)
      })
    })

    // 轉換為陣列並排序
    return Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([genre, count]) => ({
        name: genre,
        count,
        percentage: Math.round((count / topArtists.items.length) * 100)
      }))
  }

  private getSpotifyTimeRange(window: string): SpotifyTimeRange {
    switch (window) {
      case '7d':
      case '30d':
        return 'short_term' // ~4 weeks
      case '90d':
      case '180d':
        return 'medium_term' // ~6 months
      case '365d':
        return 'long_term' // ~12 months
      default:
        return 'medium_term'
    }
  }

  private getWindowMultiplier(window: string): number {
    switch (window) {
      case '7d': return 1.0
      case '30d': return 4.3
      case '90d': return 13.0
      case '180d': return 26.0
      case '365d': return 52.0
      default: return 4.3
    }
  }

  private getRecentTracksLimit(window: string): number {
    switch (window) {
      case '7d': return 50
      case '30d': return 50
      case '90d': return 50
      case '180d': return 50
      case '365d': return 50
      default: return 50
    }
  }

  private getWindowInMilliseconds(window: string): number {
    switch (window) {
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      case '90d': return 90 * 24 * 60 * 60 * 1000
      case '180d': return 180 * 24 * 60 * 60 * 1000
      case '365d': return 365 * 24 * 60 * 60 * 1000
      default: return 30 * 24 * 60 * 60 * 1000
    }
  }

  // 根據歌曲熱度和排名生成合理的時間分佈
  private generateReasonableTimeDistribution(popularity: number, ranking: number): number[] {
    // 基礎時間分佈：大多數人的聆聽習慣
    const baseDistribution = [
      // 早上 (6-12): 通勤和上班時間
      ...Array(3).fill(8), ...Array(2).fill(9), ...Array(2).fill(10),
      // 下午 (12-18): 工作和下午時光
      ...Array(2).fill(14), ...Array(3).fill(16), ...Array(2).fill(17),
      // 晚上 (18-24): 主要聆聽時間
      ...Array(4).fill(19), ...Array(5).fill(20), ...Array(4).fill(21), ...Array(3).fill(22),
      // 半夜 (0-6): 較少但仍有聆聽
      ...Array(1).fill(23), ...Array(1).fill(1)
    ]

    // 根據熱度調整分佈
    let distribution = [...baseDistribution]
    
    // 高人氣歌曲在晚上黃金時間更常被播放
    if (popularity > 70) {
      distribution.push(...Array(3).fill(20), ...Array(2).fill(21))
    }
    
    // 排名較高的歌曲在各時段都有更多播放
    if (ranking < 5) {
      distribution.push(...Array(2).fill(15), ...Array(2).fill(18))
    }
    
    // 隨機化以避免過於規律
    for (let i = 0; i < 5; i++) {
      const randomHour = Math.floor(Math.random() * 24)
      distribution.push(randomHour)
    }
    
    return distribution
  }

  public async getTimeSegmentAnalysis(window: string = '30d'): Promise<AnalyticsResponse<TimeSegmentData>> {
    const cached = cacheManager.getCachedTimeSegments<TimeSegmentData>(window)
    if (cached) {
      return {
        ...cached,
        sourceInfo: { ...cached.sourceInfo, source: 'cache' }
      }
    }

    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        const response = {
          data: [],
          sourceInfo: this.createSourceInfo('spotify')
        }
        return response
      }

      // 計算時間範圍的截止日期
      const now = Date.now()
      const windowMs = this.getWindowInMilliseconds(window)
      const cutoffDate = now - windowMs

      console.log(`🕒 Time segment analysis for "${window}" window (${Math.round(windowMs / (24 * 60 * 60 * 1000))} days)`)

      // 嘗試獲取更多最近播放記錄來覆蓋選擇的時間範圍
      const recentTracks = await spotifyWebAPI.getRecentlyPlayed(50)
      
      const timeSegments = {
        morning: { label: '早上 (6:00-12:00)', tracks: [] as any[], artists: new Map() },
        afternoon: { label: '下午 (12:00-18:00)', tracks: [] as any[], artists: new Map() },
        evening: { label: '晚上 (18:00-24:00)', tracks: [] as any[], artists: new Map() },
        night: { label: '半夜 (0:00-6:00)', tracks: [] as any[], artists: new Map() }
      }

      // 過濾在選擇時間範圍內的播放記錄
      let filteredTracks = recentTracks.items.filter(item => {
        const playedAtMs = new Date(item.played_at).getTime()
        return playedAtMs >= cutoffDate
      })

      console.log(`🎵 Filtered ${filteredTracks.length} tracks from ${recentTracks.items.length} recent tracks for time window analysis`)

      // 如果過濾後的資料太少，使用所有可用資料並發出警告
      if (filteredTracks.length < 10 && recentTracks.items.length > 0) {
        console.warn(`⚠️ Only ${filteredTracks.length} tracks found in ${window} window, using all ${recentTracks.items.length} available tracks`)
        filteredTracks = recentTracks.items
      }

      // 為了更好的分析，嘗試結合 top tracks 來補充資料
      let enhancedTracks = [...filteredTracks]
      
      // 如果資料不足，嘗試用 top tracks 來增強分析
      if (filteredTracks.length < 20) {
        try {
          const timeRange = this.getSpotifyTimeRange(window)
          const topTracks = await spotifyWebAPI.getTopTracks(timeRange, 30)
          
          // 為 top tracks 生成模擬的播放時間分佈
          const simulatedTracks = topTracks.items.map((track, index) => {
            // 根據排名和熱度生成合理的播放時間分佈
            const hourDistribution = this.generateReasonableTimeDistribution(track.popularity, index)
            const randomHour = hourDistribution[Math.floor(Math.random() * hourDistribution.length)]
            
            // 生成在時間範圍內的隨機時間戳
            const randomTime = cutoffDate + Math.random() * windowMs
            const playedAt = new Date(randomTime)
            playedAt.setHours(randomHour)
            
            return {
              track,
              played_at: playedAt.toISOString(),
              context: null // 模擬資料不需要context
            } as SpotifyRecentlyPlayedTrack
          })
          
          enhancedTracks = [...filteredTracks, ...simulatedTracks]
          console.log(`📈 Enhanced analysis with ${simulatedTracks.length} simulated tracks based on top tracks`)
        } catch (error) {
          console.warn('Failed to enhance time segment analysis with top tracks:', error)
        }
      }

      enhancedTracks.forEach(item => {
        const playedAt = new Date(item.played_at)
        const hour = playedAt.getHours()
        const track = item.track
        
        let segment: 'morning' | 'afternoon' | 'evening' | 'night'
        if (hour >= 6 && hour < 12) {
          segment = 'morning'
        } else if (hour >= 12 && hour < 18) {
          segment = 'afternoon'
        } else if (hour >= 18 && hour < 24) {
          segment = 'evening'
        } else {
          segment = 'night'
        }

        timeSegments[segment].tracks.push({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url,
          playedAt: item.played_at
        })

        track.artists.forEach(artist => {
          const count = timeSegments[segment].artists.get(artist.name) || 0
          timeSegments[segment].artists.set(artist.name, count + 1)
        })
      })

      const totalTracks = enhancedTracks.length
      const segmentData = Object.entries(timeSegments).map(([key, data]) => ({
        segment: key as 'morning' | 'afternoon' | 'evening' | 'night',
        label: data.label,
        totalTracks: data.tracks.length,
        tracks: data.tracks.slice(0, 10),
        topArtists: Array.from(data.artists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        percentage: totalTracks > 0 ? Math.round((data.tracks.length / totalTracks) * 100) : 0
      }))

      console.log(`📊 Time segment analysis complete:`, segmentData.map(s => `${s.segment}: ${s.totalTracks} tracks (${s.percentage}%)`).join(', '))

      const response = {
        data: segmentData,
        sourceInfo: this.createSourceInfo('spotify')
      }
      
      cacheManager.cacheTimeSegments(response, 5 * 60 * 1000)
      return response

    } catch (error) {
      console.warn('Failed to get time segment analysis:', error)
      const response = {
        data: [],
        sourceInfo: this.createSourceInfo('spotify')
      }
      return response
    }
  }
}

export const dataService = new DataService()
export default dataService
