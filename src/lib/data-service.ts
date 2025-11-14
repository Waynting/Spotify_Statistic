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
  private createSourceInfo(
    source: 'spotify' | 'cache',
    options?: {
      isEstimated?: boolean
      actualDataPoints?: number
      hasSimulatedData?: boolean
      apiLimitations?: string[]
    }
  ): DataSourceInfo {
    return {
      source,
      timestamp: Date.now(),
      isOnline: navigator.onLine,
      hasValidToken: spotifyWebAPI.isAuthenticated(),
      isEstimated: options?.isEstimated,
      actualDataPoints: options?.actualDataPoints,
      hasSimulatedData: options?.hasSimulatedData,
      apiLimitations: options?.apiLimitations
    }
  }

  /**
   * Analyzes Spotify track data and aggregates by album
   * For 'recent' type: uses actual played_at timestamps
   * For 'top' type: tracks are from Top Tracks API (no timestamps), so we use current time as approximation
   */
  private analyzeSpotifyData(tracks: (SpotifyTrack | SpotifyRecentlyPlayedTrack)[], type: 'top' | 'recent'): SpotifyTrackAnalysis[] {
    const trackMap = new Map<string, SpotifyTrackAnalysis>()
    
    tracks.forEach((item, index) => {
      const track = type === 'recent' ? (item as SpotifyRecentlyPlayedTrack).track : (item as SpotifyTrack)
      
      // For recent tracks, use actual played_at timestamp
      // For top tracks, we don't have timestamps, so use current time as approximation
      // Note: Top tracks are ranked by popularity, not by recency
      const playedAt = type === 'recent' 
        ? new Date((item as SpotifyRecentlyPlayedTrack).played_at).getTime() 
        : Date.now() // Top tracks: use current time as approximation
      
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
      analysis.playTime += track.duration_ms / 1000 // Convert ms to seconds
      // For recent tracks, use actual timestamp; for top tracks, keep current time
      if (type === 'recent') {
        analysis.lastPlayed = Math.max(analysis.lastPlayed, playedAt)
      }
    })
    
    return Array.from(trackMap.values())
  }

  /**
   * Converts track analysis data to album rows with play count estimates
   * Prioritizes actual play counts from Recently Played API over estimates
   */
  private convertToAlbumRows(analysis: SpotifyTrackAnalysis[], window: string): AlbumRow[] {
    const windowMultiplier = this.getWindowMultiplier(window)

    return analysis
      .sort((a, b) => b.playCount - a.playCount)
      .map((item, index) => {
        const basePlayCount = item.playCount
        
        // If we have actual play data, use it with minimal adjustment
        // If we only have estimated data, apply conservative multiplier
        let adjustedPlays: number
        if (basePlayCount > 0) {
          // Has actual play data: use it with minimal ranking-based adjustment
          const rankingBonus = Math.max(0, 5 - (index / 3)) // Small bonus for top albums
          adjustedPlays = Math.max(
            Math.round(basePlayCount * (1 + windowMultiplier * 0.1) + rankingBonus),
            basePlayCount // Never reduce actual play counts
          )
        } else {
          // No actual data: conservative estimate based on ranking
          const rankingFactor = Math.max(1, 20 - index)
          adjustedPlays = Math.max(
            Math.round(rankingFactor * windowMultiplier * 0.15),
            1
          )
        }

        // Calculate minutes: use actual play time if available, otherwise estimate
        const actualMinutes = item.playTime / 60
        const estimatedMinutes = adjustedPlays * 3 // Assume ~3 minutes per play
        const minutes = actualMinutes > 0 
          ? Math.round(actualMinutes * (1 + windowMultiplier * 0.1) * 100) / 100
          : estimatedMinutes

        return {
          album_id: item.albumId,
          album_name: item.albumName,
          album_image: item.albumImageUrl,
          plays: adjustedPlays,
          minutes: Math.round(minutes * 100) / 100,
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
      const maxRecentTracks = this.getMaxRecentTracks(window)

      const [topTracks, recentTracksArray] = await Promise.all([
        spotifyWebAPI.getTopTracks(timeRange, 50).then(result => {
          console.log('✅ Top tracks fetched:', result.items?.length || 0, 'tracks')
          return result
        }),
        spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).then(tracks => {
          console.log('✅ Recent tracks fetched:', tracks.length, 'tracks across multiple requests')
          return tracks
        }).catch(error => {
          console.log('⚠️ Recent tracks failed:', error.message)
          return []
        })
      ])

      const recentTracks = { items: recentTracksArray }

      // Analyze and combine data
      // Filter recent tracks by time window first for accurate analysis
      const windowMs = this.getWindowInMilliseconds(window)
      const cutoffTime = Date.now() - windowMs
      const filteredRecentTracks = recentTracks.items.filter(item => {
        const playedAt = new Date(item.played_at).getTime()
        return playedAt >= cutoffTime
      })

      const topAnalysis = this.analyzeSpotifyData(topTracks.items, 'top')
      const recentAnalysis = this.analyzeSpotifyData(filteredRecentTracks, 'recent')

      // Merge analyses, prioritizing actual play data from recent tracks
      const mergedMap = new Map<string, SpotifyTrackAnalysis>()
      
      // Add recent tracks first (actual play data has priority)
      recentAnalysis.forEach(analysis => {
        mergedMap.set(analysis.albumId, { ...analysis })
      })
      
      // Enhance with top tracks data (for albums not in recent plays)
      topAnalysis.forEach(analysis => {
        const existing = mergedMap.get(analysis.albumId)
        if (existing) {
          // If we have recent play data, keep it but update last played if needed
          // Top tracks don't have timestamps, so we don't update lastPlayed from them
          // Only add play count if it's higher (though recent data should be more accurate)
          if (analysis.playCount > existing.playCount) {
            existing.playCount = analysis.playCount
          }
        } else {
          // Add albums from top tracks that weren't in recent plays
          mergedMap.set(analysis.albumId, analysis)
        }
      })

      const result = this.convertToAlbumRows(Array.from(mergedMap.values()), window)
      console.log('📊 Processed albums:', result.length)
      
      // Apply time window filtering for ALL windows based on last_played timestamp
      const windowMs = this.getWindowInMilliseconds(window)
      const cutoffTime = Date.now() - windowMs
      
      // Filter albums by time window - only include albums played within the window
      const filteredResult = result
        .filter(album => {
          // If we have actual play data with timestamp, use it
          if (album.last_played && album.last_played > 0) {
            return album.last_played >= cutoffTime
          }
          // If no timestamp, include it (from top tracks, which are already filtered by Spotify's time_range)
          // But prioritize albums with actual play timestamps
          return true
        })
        .sort((a, b) => {
          // Sort by plays first, then by last_played timestamp
          if (b.plays !== a.plays) {
            return b.plays - a.plays
          }
          // If plays are equal, prefer albums with more recent timestamps
          return (b.last_played || 0) - (a.last_played || 0)
        })
        .slice(0, 15)
      
      console.log(`📅 Filtered for ${window} window: ${filteredResult.length}/${result.length} albums within time range`)
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
    // Note: We don't use cache here to ensure fresh data for each time window
    // Cache is handled at the React Query level with proper invalidation
    // Always fetch fresh data to ensure time window filtering is accurate

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
      // Determine if data is estimated or actual
      const hasActualData = data.some((item: any) => item.plays !== undefined)
      const actualDataPoints = data.length

      const response = {
        data,
        sourceInfo: this.createSourceInfo('spotify', {
          isEstimated: true, // Most play counts are estimated due to API limitations
          actualDataPoints,
          apiLimitations: [
            'Spotify API 限制每次最多 50 個項目',
            '播放次數基於最近播放記錄和排名估算',
            '實際數據可能因 API 限制而不完整'
          ]
        })
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
      // 根據時間窗口決定要獲取多少最近播放記錄
      const maxRecentTracks = this.getMaxRecentTracks(window)

      // 並行獲取 top tracks 和多批次的 recent tracks
      const [topTracks, recentTracks] = await Promise.all([
        spotifyWebAPI.getTopTracks(timeRange, 50),
        spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks)
      ])

      console.log(`📊 Fetched ${recentTracks.length} recent tracks for analysis`)

      // Filter recent tracks by time window for accurate counting
      const windowMs = this.getWindowInMilliseconds(window)
      const cutoffTime = Date.now() - windowMs
      const filteredRecentTracks = recentTracks.filter(item => {
        const playedAt = new Date(item.played_at).getTime()
        return playedAt >= cutoffTime
      })

      console.log(`🎯 Filtered ${filteredRecentTracks.length}/${recentTracks.length} tracks within ${window} window`)

      // 統計時間窗口內的實際播放次數（優先使用實際數據）
      const playCountMap = new Map<string, number>()
      filteredRecentTracks.forEach(item => {
        const trackId = item.track.id
        playCountMap.set(trackId, (playCountMap.get(trackId) || 0) + 1)
      })

      // Build a map of all tracks from filtered recent tracks (within time window)
      const allTracksInWindow = new Map<string, AnalyticsTrackData>()
      
      // First, add all tracks from filtered recent tracks with actual play counts
      filteredRecentTracks.forEach(item => {
        const trackId = item.track.id
        const existing = allTracksInWindow.get(trackId)
        const playCount = playCountMap.get(trackId) || 0
        
        if (!existing) {
          allTracksInWindow.set(trackId, {
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || 'Unknown',
            album: item.track.album.name,
            plays: playCount,
            duration: Math.round(item.track.duration_ms / 1000 / 60),
            popularity: item.track.popularity,
            imageUrl: item.track.album.images?.[0]?.url
          })
        } else {
          // Update play count if higher
          existing.plays = Math.max(existing.plays, playCount)
        }
      })
      
      // Then, add top tracks that might not be in recent plays
      // But only if they're in the top tracks list (which Spotify filters by time_range)
      topTracks.items.forEach((track, index) => {
        const existing = allTracksInWindow.get(track.id)
        
        if (!existing) {
          // Not in recent plays, estimate based on ranking
          const rankingFactor = Math.max(1, 50 - index)
          const windowMultiplier = this.getWindowMultiplier(window)
          const estimatedPlays = Math.max(
            Math.round(rankingFactor * windowMultiplier * 0.1),
            1
          )
          
          allTracksInWindow.set(track.id, {
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown',
            album: track.album.name,
            plays: estimatedPlays,
            duration: Math.round(track.duration_ms / 1000 / 60),
            popularity: track.popularity,
            imageUrl: track.album.images?.[0]?.url
          })
        } else {
          // Already exists from recent plays, keep the actual play count
          // But update other fields if needed
          existing.popularity = track.popularity
        }
      })

      // Convert to array and sort by play count
      return Array.from(allTracksInWindow.values()).sort((a, b) => b.plays - a.plays)
    } catch (error) {
      console.error('Error in getTracksAnalysis:', error)
      // Fallback: 返回帶有保守估算的數據（當無法獲取實際播放記錄時）
      const topTracks = await spotifyWebAPI.getTopTracks(timeRange, 50)
      const fallbackTracks = topTracks.items.map((track, index) => {
        // 基於排名的保守估算
        const rankingFactor = Math.max(1, 50 - index)
        const windowMultiplier = this.getWindowMultiplier(window)
        const estimatedPlays = Math.max(Math.round(rankingFactor * windowMultiplier * 0.1), 1)

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

      // 按播放次數排序
      return fallbackTracks.sort((a, b) => b.plays - a.plays)
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
    const maxRecentTracks = this.getMaxRecentTracks(window)

    // 注意：Spotify API 限制每次最多只能獲取 50 位藝人
    const [topArtists, recentTracksArray] = await Promise.all([
      spotifyWebAPI.getTopArtists(timeRange, 50),
      spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).catch(() => [])
    ])

    // Filter recent tracks by time window for accurate counting
    const windowMs = this.getWindowInMilliseconds(window)
    const cutoffTime = Date.now() - windowMs
    const filteredRecentTracks = recentTracksArray.filter(item => {
      const playedAt = new Date(item.played_at).getTime()
      return playedAt >= cutoffTime
    })
    
    // 統計時間窗口內的藝術家實際播放次數和時長
    const artistPlayCount = new Map<string, number>()
    const artistPlayTime = new Map<string, number>()
    
    filteredRecentTracks.forEach(item => {
      item.track.artists.forEach(artist => {
        artistPlayCount.set(artist.id, (artistPlayCount.get(artist.id) || 0) + 1)
        artistPlayTime.set(artist.id, (artistPlayTime.get(artist.id) || 0) + item.track.duration_ms / 1000 / 60)
      })
    })
    
    // Build artists map with actual play data from filtered recent tracks
    const artistsMap = new Map<string, AnalyticsArtistData>()
    
    // First, add artists from filtered recent tracks (within time window)
    filteredRecentTracks.forEach(item => {
      item.track.artists.forEach(artist => {
        const existing = artistsMap.get(artist.id)
        const playCount = artistPlayCount.get(artist.id) || 0
        const playTime = artistPlayTime.get(artist.id) || 0
        
        if (!existing) {
          // Find full artist data from topArtists if available
          const fullArtist = topArtists.items.find(a => a.id === artist.id)
          
          artistsMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            genres: fullArtist?.genres ? Array.isArray(fullArtist.genres) ? fullArtist.genres.slice(0, 3) : [] : [],
            followers: fullArtist?.followers?.total || 0,
            popularity: fullArtist?.popularity || 0,
            plays: playCount,
            minutes: Math.round(playTime),
            imageUrl: fullArtist?.images?.[0]?.url
          })
        } else {
          // Update play counts and time
          existing.plays = Math.max(existing.plays, playCount)
          existing.minutes = Math.max(existing.minutes, Math.round(playTime))
        }
      })
    })
    
    // Then, add top artists that might not be in recent plays
    topArtists.items.forEach((artist: SpotifyArtist, index: number) => {
      const existing = artistsMap.get(artist.id)
      
      if (!existing) {
        // Not in recent plays, estimate based on ranking
        const rankingFactor = Math.max(1, 30 - index)
        const estimatedPlays = Math.max(
          Math.round(rankingFactor * windowMultiplier * 0.15),
          1
        )
        
        artistsMap.set(artist.id, {
          id: artist.id,
          name: artist.name,
          genres: Array.isArray(artist.genres) ? artist.genres.slice(0, 3) : [],
          followers: artist.followers?.total || 0,
          popularity: artist.popularity,
          plays: estimatedPlays,
          minutes: Math.round(estimatedPlays * 3), // Estimate ~3 minutes per play
          imageUrl: artist.images?.[0]?.url
        })
      } else {
        // Already exists, update with full artist data
        existing.genres = Array.isArray(artist.genres) ? artist.genres.slice(0, 3) : []
        existing.followers = artist.followers?.total || 0
        existing.popularity = artist.popularity
        existing.imageUrl = artist.images?.[0]?.url || existing.imageUrl
      }
    })
    
    // Convert to array and sort by actual play count
    const result = Array.from(artistsMap.values()).sort((a, b) => b.plays - a.plays)
    
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

  /**
   * Maps application time windows to Spotify API time ranges
   * According to Spotify API docs:
   * - short_term: approximately last 4 weeks
   * - medium_term: approximately last 6 months
   * - long_term: calculated from several years of data and including all new data as it becomes available
   */
  private getSpotifyTimeRange(window: string): SpotifyTimeRange {
    switch (window) {
      case '7d':
      case '30d':
        return 'short_term' // ~4 weeks, best match for 7d and 30d
      case '90d':
      case '180d':
        return 'medium_term' // ~6 months, best match for 90d and 180d
      case '365d':
        return 'long_term' // All-time data, best match for 365d
      default:
        return 'medium_term'
    }
  }

  /**
   * Calculates multiplier for estimating play counts based on time window
   * These multipliers are conservative estimates used when actual play data is limited
   * Note: Actual play counts from Recently Played API are always preferred over estimates
   */
  private getWindowMultiplier(window: string): number {
    switch (window) {
      case '7d': return 1.0   // No scaling needed for recent data
      case '30d': return 1.2  // Minimal scaling for 30 days
      case '90d': return 1.8  // Conservative scaling for 90 days
      case '180d': return 2.5 // Conservative scaling for 180 days
      case '365d': return 3.5 // Conservative scaling for 365 days
      default: return 1.2
    }
  }

  /**
   * Determines how many recently played tracks to fetch based on time window
   * Note: Spotify API limitations:
   * - Recently Played API can only return up to ~50 tracks per request
   * - Historical data beyond ~50 tracks may not be available
   * - For longer time windows, we rely more on Top Tracks/Artists data
   */
  private getMaxRecentTracks(window: string): number {
    switch (window) {
      case '7d': return 50   // Recent data is most accurate for short windows
      case '30d': return 100  // Try to get more for 30 days
      case '90d': return 150  // Limited by API constraints
      case '180d': return 200 // Limited by API constraints
      case '365d': return 200 // Limited by API constraints
      default: return 100
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
      const maxRecentTracks = this.getMaxRecentTracks(window)

      console.log(`🕒 Time segment analysis for "${window}" window (${Math.round(windowMs / (24 * 60 * 60 * 1000))} days)`)

      // 獲取更多最近播放記錄來覆蓋選擇的時間範圍
      const recentTracksArray = await spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks)
      const recentTracks = { items: recentTracksArray }
      
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
      
      // Track whether we're using simulated data
      let hasSimulatedData = false

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
          hasSimulatedData = true
          console.log(`⚠️ Enhanced analysis with ${simulatedTracks.length} simulated tracks (insufficient actual data)`)
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

        track.artists.forEach((artist: SpotifyArtist) => {
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
        sourceInfo: this.createSourceInfo('spotify', {
          hasSimulatedData,
          actualDataPoints: filteredTracks.length,
          apiLimitations: hasSimulatedData ? [
            '實際數據不足，部分時間分佈為基於熱門歌曲的模擬數據',
            `僅 ${filteredTracks.length} 條實際播放記錄可用於分析`
          ] : [
            `基於 ${filteredTracks.length} 條實際播放記錄`
          ]
        })
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
