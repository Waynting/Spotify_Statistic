import { spotifyWebAPI } from './spotify-web-api'
import { spotifyApi } from './api' // fallback to demo data
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
  private createSourceInfo(source: 'spotify' | 'demo' | 'cache'): DataSourceInfo {
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
      // 如果離線或 API 不可用，嘗試使用緩存
      if (!spotifyWebAPI.isAuthenticated()) {
        console.log('⚠️ Not authenticated, using demo data')
        return spotifyApi.data.queryTopAlbumsWindow(window)
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
      console.log('🔄 Falling back to demo data')
      
      // 最後退回到 demo 數據
      return spotifyApi.data.queryTopAlbumsWindow(window)
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
        const demoData = this.getDemoAnalyticsData(window, analysisType)
        const response = {
          data: demoData,
          sourceInfo: this.createSourceInfo('demo')
        }
        
        // Cache demo data for shorter time
        cacheManager.cacheAnalytics(window, analysisType, response, 2 * 60 * 1000) // 2 minutes
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
      console.warn('Failed to get analytics data, falling back to demo:', error)
      const demoData = this.getDemoAnalyticsData(window, analysisType)
      const response = {
        data: demoData,
        sourceInfo: this.createSourceInfo('demo')
      }
      
      // Cache fallback data for short time
      cacheManager.cacheAnalytics(window, analysisType, response, 1 * 60 * 1000) // 1 minute
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
        followers: (artist as any).followers?.total || 0,
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

  private getDemoAnalyticsData(window: string, analysisType: string): (AnalyticsTrackData | AnalyticsAlbumData | AnalyticsArtistData | AnalyticsGenreData)[] {
    const multiplier = this.getWindowMultiplier(window)
    
    switch (analysisType) {
      case 'tracks':
        return [
          { id: '1', name: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', plays: Math.round(45 * multiplier), duration: 6, popularity: 95 },
          { id: '2', name: 'Hotel California', artist: 'Eagles', album: 'Hotel California', plays: Math.round(42 * multiplier), duration: 7, popularity: 92 },
          { id: '3', name: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', plays: Math.round(40 * multiplier), duration: 8, popularity: 94 },
          { id: '4', name: 'Imagine', artist: 'John Lennon', album: 'Imagine', plays: Math.round(38 * multiplier), duration: 3, popularity: 90 },
          { id: '5', name: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', plays: Math.round(35 * multiplier), duration: 6, popularity: 88 }
        ]
      
      case 'artists':
        return [
          { id: '1', name: 'Queen', genres: ['rock', 'classic rock'], followers: 12500000, plays: Math.round(120 * multiplier), popularity: 95, minutes: Math.round(480 * multiplier / 10) },
          { id: '2', name: 'The Beatles', genres: ['rock', 'pop'], followers: 15000000, plays: Math.round(115 * multiplier), popularity: 98, minutes: Math.round(460 * multiplier / 10) },
          { id: '3', name: 'Led Zeppelin', genres: ['rock', 'hard rock'], followers: 8000000, plays: Math.round(110 * multiplier), popularity: 92, minutes: Math.round(550 * multiplier / 10) },
          { id: '4', name: 'Pink Floyd', genres: ['progressive rock', 'psychedelic rock'], followers: 9500000, plays: Math.round(105 * multiplier), popularity: 94, minutes: Math.round(630 * multiplier / 10) },
          { id: '5', name: 'AC/DC', genres: ['hard rock', 'heavy metal'], followers: 7200000, plays: Math.round(100 * multiplier), popularity: 89, minutes: Math.round(400 * multiplier / 10) }
        ]
      
      case 'genres':
        return [
          { name: 'rock', count: Math.round(25 * multiplier), percentage: 35 },
          { name: 'pop', count: Math.round(20 * multiplier), percentage: 28 },
          { name: 'electronic', count: Math.round(15 * multiplier), percentage: 21 },
          { name: 'hip hop', count: Math.round(12 * multiplier), percentage: 17 },
          { name: 'jazz', count: Math.round(8 * multiplier), percentage: 11 },
          { name: 'classical', count: Math.round(5 * multiplier), percentage: 7 }
        ]
      
      default:
        // For demo data, return track data as default  
        return [
          { id: '1', name: 'Demo Track', artist: 'Demo Artist', album: 'Demo Album', plays: Math.round(45 * multiplier), duration: 6, popularity: 95 } as AnalyticsTrackData
        ]
    }
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
    // 根據時間窗口調整獲取的最近播放記錄數量
    // Spotify API 限制最多50首，但我們可以根據需要調整
    switch (window) {
      case '7d': return 50    // 7天
      case '30d': return 50   // 30天
      case '90d': return 50   // 90天
      case '180d': return 50  // 180天
      case '365d': return 50  // 365天
      default: return 50
    }
  }

  // 新增時間段分析方法
  public async getTimeSegmentAnalysis(window: string = '30d'): Promise<AnalyticsResponse<TimeSegmentData>> {
    // Check cache first (include window in cache key)
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
          data: this.getDemoTimeSegmentData(window),
          sourceInfo: this.createSourceInfo('demo')
        }
        
        // Cache demo data for shorter time
        cacheManager.cacheTimeSegments(response, 2 * 60 * 1000, window) // 2 minutes
        return response
      }

      // 根據時間窗口獲取不同數量的最近播放記錄
      const limit = this.getRecentTracksLimit(window)
      const recentTracks = await spotifyWebAPI.getRecentlyPlayed(limit)
      
      // 定義時間段
      const timeSegments = {
        morning: { label: '早上 (6:00-12:00)', tracks: [] as any[], genres: new Map(), artists: new Map() },
        afternoon: { label: '下午 (12:00-18:00)', tracks: [] as any[], genres: new Map(), artists: new Map() },
        evening: { label: '晚上 (18:00-24:00)', tracks: [] as any[], genres: new Map(), artists: new Map() },
        night: { label: '半夜 (0:00-6:00)', tracks: [] as any[], genres: new Map(), artists: new Map() }
      }

      // 分析每個播放記錄的時間段
      recentTracks.items.forEach(item => {
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

        // 添加曲目到對應時間段
        timeSegments[segment].tracks.push({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url,
          playedAt: item.played_at
        })

        // 統計藝術家
        track.artists.forEach(artist => {
          const count = timeSegments[segment].artists.get(artist.name) || 0
          timeSegments[segment].artists.set(artist.name, count + 1)
        })
      })

      // 轉換為前端需要的格式
      const segmentData = Object.entries(timeSegments).map(([key, data]) => ({
        segment: key as 'morning' | 'afternoon' | 'evening' | 'night',
        label: data.label,
        totalTracks: data.tracks.length,
        tracks: data.tracks.slice(0, 10), // 只取前 10 首
        topArtists: Array.from(data.artists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        percentage: Math.round((data.tracks.length / recentTracks.items.length) * 100)
      }))

      const response = {
        data: segmentData,
        sourceInfo: this.createSourceInfo('spotify')
      }
      
      // Cache real data for longer time
      cacheManager.cacheTimeSegments(response, 5 * 60 * 1000) // 5 minutes
      return response

    } catch (error) {
      console.warn('Failed to get time segment analysis:', error)
      const response = {
        data: this.getDemoTimeSegmentData(),
        sourceInfo: this.createSourceInfo('demo')
      }
      
      // Cache fallback data for short time
      cacheManager.cacheTimeSegments(response, 1 * 60 * 1000) // 1 minute
      return response
    }
  }

  private getDemoTimeSegmentData(window: string = '30d'): TimeSegmentData[] {
    const multiplier = this.getWindowMultiplier(window)
    
    const baseTotals = { morning: 12, afternoon: 18, evening: 15, night: 5 }
    const adjustedTotals = {
      morning: Math.round(baseTotals.morning * multiplier),
      afternoon: Math.round(baseTotals.afternoon * multiplier),
      evening: Math.round(baseTotals.evening * multiplier),
      night: Math.round(baseTotals.night * multiplier)
    }
    
    const grandTotal = Object.values(adjustedTotals).reduce((sum, val) => sum + val, 0)
    
    return [
      {
        segment: 'morning' as const,
        label: '早上 (6:00-12:00)',
        totalTracks: adjustedTotals.morning,
        tracks: [],
        topArtists: [
          { name: 'Taylor Swift', count: Math.round(3 * multiplier) }, 
          { name: 'Ed Sheeran', count: Math.round(2 * multiplier) }
        ],
        percentage: Math.round((adjustedTotals.morning / grandTotal) * 100)
      },
      {
        segment: 'afternoon' as const,
        label: '下午 (12:00-18:00)',
        totalTracks: adjustedTotals.afternoon,
        tracks: [],
        topArtists: [
          { name: 'The Weeknd', count: Math.round(4 * multiplier) }, 
          { name: 'Dua Lipa', count: Math.round(3 * multiplier) }
        ],
        percentage: Math.round((adjustedTotals.afternoon / grandTotal) * 100)
      },
      {
        segment: 'evening' as const,
        label: '晚上 (18:00-24:00)',
        totalTracks: adjustedTotals.evening,
        tracks: [],
        topArtists: [
          { name: 'Billie Eilish', count: Math.round(3 * multiplier) }, 
          { name: 'Post Malone', count: Math.round(2 * multiplier) }
        ],
        percentage: Math.round((adjustedTotals.evening / grandTotal) * 100)
      },
      {
        segment: 'night' as const,
        label: '半夜 (0:00-6:00)',
        totalTracks: adjustedTotals.night,
        tracks: [],
        topArtists: [
          { name: 'Lo-fi Hip Hop', count: Math.round(2 * multiplier) }, 
          { name: 'Ambient', count: Math.round(1 * multiplier) }
        ],
        percentage: Math.round((adjustedTotals.night / grandTotal) * 100)
      }
    ]
  }
}

export const dataService = new DataService()
export default dataService