import { spotifyWebAPI } from './spotify-web-api'
import { backendAPI, BackendTrack, BackendArtist } from './backend-api'
import { AlbumRow } from '@/types'
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
} from '@/types/spotify'
import { cacheManager } from './cache-manager'


/**
 * Merged play record - represents a single play event from any source
 */
interface MergedPlayRecord {
  trackId: string
  trackName: string
  artistId: string
  artistName: string
  albumId: string
  albumName: string
  playedAt: number // timestamp
  durationMs: number
  popularity?: number
  albumImageUrl?: string
}

/**
 * Data Merger - merges real-time and historical play records
 * Core principle: Show only actual play records, no estimation
 */
class DataMerger {
  /**
   * Merge real-time and historical play records
   * Deduplicates based on (trackId, playedAt) to avoid double counting
   */
  mergePlayRecords(
    realtimeRecords: SpotifyRecentlyPlayedTrack[],
    historicalRecords: BackendTrack[],
    window: string
  ): MergedPlayRecord[] {
    const windowMs = this.getWindowInMilliseconds(window)
    const cutoffTime = Date.now() - windowMs
    
    // Use Set to deduplicate by (trackId, playedAt)
    const recordKeySet = new Set<string>()
    const mergedRecords: MergedPlayRecord[] = []
    
    // Add real-time records
    realtimeRecords.forEach(item => {
      const playedAt = new Date(item.played_at).getTime()
      if (playedAt < cutoffTime) return // Filter by time window
      
      const key = `${item.track.id}_${playedAt}`
      if (!recordKeySet.has(key)) {
        recordKeySet.add(key)
        mergedRecords.push({
          trackId: item.track.id,
          trackName: item.track.name,
          artistId: item.track.artists[0]?.id || '',
          artistName: item.track.artists[0]?.name || 'Unknown',
          albumId: item.track.album.id,
          albumName: item.track.album.name,
          playedAt: playedAt,
          durationMs: item.track.duration_ms,
          popularity: item.track.popularity,
          albumImageUrl: item.track.album.images?.[0]?.url
        })
      }
    })
    
    // Add historical records (avoid duplicates)
    // Backend API now returns raw play records (one record per play)
    historicalRecords.forEach(record => {
      const playedAt = new Date(record.last_played).getTime()
      if (playedAt < cutoffTime) return // Filter by time window
      
      // Each BackendTrack record represents one play
      const key = `${record.track_id}_${playedAt}`
      
      if (!recordKeySet.has(key)) {
        recordKeySet.add(key)
        mergedRecords.push({
          trackId: record.track_id,
          trackName: record.track_name,
          artistId: '', // Historical records may not have artist_id
          artistName: record.artist_name,
          albumId: '', // Historical records may not have album_id
          albumName: record.album_name,
          playedAt: playedAt,
          durationMs: record.duration_ms,
          popularity: record.popularity,
          albumImageUrl: undefined
        })
      }
    })
    
    // Sort by playedAt descending (most recent first)
    return mergedRecords.sort((a, b) => b.playedAt - a.playedAt)
  }
  
  /**
   * Aggregate merged records by album
   */
  aggregateByAlbum(records: MergedPlayRecord[]): AlbumRow[] {
    const albumMap = new Map<string, {
      albumId: string
      albumName: string
      albumImageUrl?: string
      plays: number
      totalDurationMs: number
      lastPlayed: number
    }>()
    
    records.forEach(record => {
      const key = record.albumId || `${record.albumName}_${record.artistName}`
      const existing = albumMap.get(key)
      
      if (existing) {
        existing.plays += 1
        existing.totalDurationMs += record.durationMs
        existing.lastPlayed = Math.max(existing.lastPlayed, record.playedAt)
        if (!existing.albumImageUrl && record.albumImageUrl) {
          existing.albumImageUrl = record.albumImageUrl
        }
      } else {
        albumMap.set(key, {
          albumId: record.albumId || key,
          albumName: record.albumName,
          albumImageUrl: record.albumImageUrl,
          plays: 1,
          totalDurationMs: record.durationMs,
          lastPlayed: record.playedAt
        })
      }
    })
    
    return Array.from(albumMap.values())
      .map(album => ({
        album_id: album.albumId,
        album_name: album.albumName,
        album_image: album.albumImageUrl,
        plays: album.plays,
        minutes: Math.round((album.totalDurationMs / 1000 / 60) * 100) / 100,
        last_played: album.lastPlayed
      }))
      .sort((a, b) => {
        // Sort by plays first, then by last_played
        if (b.plays !== a.plays) {
          return b.plays - a.plays
        }
        return (b.last_played || 0) - (a.last_played || 0)
      })
  }
  
  /**
   * Aggregate merged records by track
   */
  aggregateByTrack(records: MergedPlayRecord[]): AnalyticsTrackData[] {
    const trackMap = new Map<string, AnalyticsTrackData>()
    
    records.forEach(record => {
      const existing = trackMap.get(record.trackId)
      
      if (existing) {
        existing.plays += 1
        existing.duration = Math.max(existing.duration, Math.round(record.durationMs / 1000 / 60))
        if (record.popularity && record.popularity > existing.popularity) {
          existing.popularity = record.popularity
        }
        if (!existing.imageUrl && record.albumImageUrl) {
          existing.imageUrl = record.albumImageUrl
        }
      } else {
        trackMap.set(record.trackId, {
          id: record.trackId,
          name: record.trackName,
          artist: record.artistName,
          album: record.albumName,
          plays: 1,
          duration: Math.round(record.durationMs / 1000 / 60),
          popularity: record.popularity || 0,
          imageUrl: record.albumImageUrl
        })
      }
    })
    
    return Array.from(trackMap.values())
      .sort((a, b) => b.plays - a.plays)
  }
  
  /**
   * Aggregate merged records by artist
   */
  aggregateByArtist(records: MergedPlayRecord[]): AnalyticsArtistData[] {
    const artistMap = new Map<string, {
      artistId: string
      artistName: string
      plays: number
      totalDurationMs: number
    }>()
    
    records.forEach(record => {
      const key = record.artistId || record.artistName
      const existing = artistMap.get(key)
      
      if (existing) {
        existing.plays += 1
        existing.totalDurationMs += record.durationMs
      } else {
        artistMap.set(key, {
          artistId: record.artistId || key,
          artistName: record.artistName,
          plays: 1,
          totalDurationMs: record.durationMs
        })
      }
    })
    
    return Array.from(artistMap.values())
      .map(artist => ({
        id: artist.artistId,
        name: artist.artistName,
        genres: [],
        followers: 0,
        popularity: 0,
        plays: artist.plays,
        minutes: Math.round((artist.totalDurationMs / 1000 / 60) * 100) / 100,
        imageUrl: undefined
      }))
      .sort((a, b) => b.plays - a.plays)
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
}

const dataMerger = new DataMerger()

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


  public async getTopAlbums(window: string): Promise<AlbumRow[]> {
    console.log('🎵 DataService.getTopAlbums called with window:', window)
    console.log('🔐 Authentication status:', spotifyWebAPI.isAuthenticated())
    
    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        console.log('⚠️ Not authenticated, returning empty data')
        return []
      }

      // Get user ID for backend API calls
      const user = await spotifyWebAPI.getCurrentUser().catch(() => null)
      const spotifyUserId = user?.id

      // Fetch real-time and historical data
      console.log('📡 Fetching data from Spotify API and database...')
      const maxRecentTracks = this.getMaxRecentTracks(window)

      const [recentTracksArray, historicalTracks] = await Promise.all([
        spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).then(tracks => {
          console.log('✅ Recent tracks fetched:', tracks.length, 'tracks')
          return tracks
        }).catch(error => {
          console.log('⚠️ Recent tracks failed:', error.message)
          return []
        }),
        // Fetch historical data from backend
        spotifyUserId 
          ? backendAPI.getHistoricalTracks(spotifyUserId, window).catch(() => {
              console.log('⚠️ Historical tracks failed')
          return []
        })
          : Promise.resolve([])
      ])

      // Merge real-time and historical data using DataMerger
      const mergedRecords = dataMerger.mergePlayRecords(
        recentTracksArray,
        historicalTracks,
        window
      )
      
      console.log(`📊 Merged ${mergedRecords.length} play records (realtime: ${recentTracksArray.length}, historical: ${historicalTracks.length})`)

      // Aggregate by album
      const albums = dataMerger.aggregateByAlbum(mergedRecords)
      
      console.log(`📊 Processed ${albums.length} albums for "${window}" window`)
      return albums.slice(0, 50) // Show top 50 albums

    } catch (error) {
      console.error('❌ Failed to get Spotify data:', error)
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
      // All data is actual play records - no estimation
      const response = {
        data,
        sourceInfo: this.createSourceInfo('spotify', {
          isEstimated: false // All data is actual play records
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
    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        return []
      }

      // Get user ID for backend API calls
      const user = await spotifyWebAPI.getCurrentUser().catch(() => null)
      const spotifyUserId = user?.id

      // Fetch real-time and historical data
      const maxRecentTracks = this.getMaxRecentTracks(window)
      
      const [recentTracksArray, historicalTracks] = await Promise.all([
        spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).catch(() => []),
        spotifyUserId 
          ? backendAPI.getHistoricalTracks(spotifyUserId, window).catch(() => [])
          : Promise.resolve([])
      ])

      console.log(`📊 Fetched ${recentTracksArray.length} recent tracks and ${historicalTracks.length} historical tracks`)

      // Merge real-time and historical data using DataMerger
      const mergedRecords = dataMerger.mergePlayRecords(
        recentTracksArray,
        historicalTracks,
        window
      )
      
      console.log(`📊 Merged ${mergedRecords.length} play records`)

      // Aggregate by track
      const tracks = dataMerger.aggregateByTrack(mergedRecords)
      
      console.log(`📊 Processed ${tracks.length} tracks for "${window}" window`)
      return tracks
    } catch (error) {
      console.error('Error in getTracksAnalysis:', error)
      return []
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
    try {
      if (!spotifyWebAPI.isAuthenticated()) {
        return []
      }

    // Get user ID for backend API calls
    const user = await spotifyWebAPI.getCurrentUser().catch(() => null)
    const spotifyUserId = user?.id

      // Fetch real-time and historical data
      const maxRecentTracks = this.getMaxRecentTracks(window)
      const timeRange = this.getSpotifyTimeRange(window)
    const maxTopArtists = this.getMaxTopArtists(window)
      
      const [recentTracksArray, historicalTracks, topArtistsArray] = await Promise.all([
      spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).catch(() => []),
      spotifyUserId 
          ? backendAPI.getHistoricalTracks(spotifyUserId, window).catch(() => [])
          : Promise.resolve([]),
        spotifyWebAPI.getTopArtistsMultiple(timeRange, maxTopArtists)
      ])

      console.log(`📊 Fetched ${recentTracksArray.length} recent tracks and ${historicalTracks.length} historical tracks`)

      // Merge real-time and historical data using DataMerger
      const mergedRecords = dataMerger.mergePlayRecords(
        recentTracksArray,
        historicalTracks,
        window
      )
      
      console.log(`📊 Merged ${mergedRecords.length} play records`)

      // Aggregate by artist
      const artists = dataMerger.aggregateByArtist(mergedRecords)
      
      // Enhance with metadata from top artists
    const artistsMap = new Map<string, AnalyticsArtistData>()
      artists.forEach(artist => {
        artistsMap.set(artist.id, artist)
      })
      
      topArtistsArray.forEach((topArtist: SpotifyArtist) => {
        const existing = artistsMap.get(topArtist.id)
        if (existing) {
          // Update metadata
          existing.genres = Array.isArray(topArtist.genres) ? topArtist.genres.slice(0, 3) : []
          existing.followers = topArtist.followers?.total || 0
          existing.popularity = topArtist.popularity
          existing.imageUrl = topArtist.images?.[0]?.url || existing.imageUrl
        }
      })
      
      const result = Array.from(artistsMap.values())
      console.log(`📊 Processed ${result.length} artists for "${window}" window`)
    return result
    } catch (error) {
      console.error('Error in getArtistsAnalysis:', error)
      return []
    }
  }

  private async getGenresAnalysis(window: string): Promise<AnalyticsGenreData[]> {
    const timeRange = this.getSpotifyTimeRange(window)
    // 獲取更多藝人以獲得更好的曲風分析
    const maxTopTracks = this.getMaxTopTracks(window)
    const maxTopArtists = this.getMaxTopArtists(window)
    const [topTracksArray, topArtistsArray] = await Promise.all([
      spotifyWebAPI.getTopTracksMultiple(timeRange, maxTopTracks),
      spotifyWebAPI.getTopArtistsMultiple(timeRange, maxTopArtists)
    ])

    // 統計曲風
    const genreCount = new Map<string, number>()
    
    // 從歌手的曲風中統計
    topArtistsArray.forEach(artist => {
      if (Array.isArray(artist.genres)) {
        artist.genres.forEach((genre: string) => {
          genreCount.set(genre, (genreCount.get(genre) || 0) + 1)
        })
      }
    })

    // 轉換為陣列並排序
    const totalArtists = topArtistsArray.length
    return Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([genre, count]) => ({
        name: genre,
        count,
        percentage: totalArtists > 0 ? Math.round((count / totalArtists) * 100) : 0
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

  /**
   * Determines how many top tracks to fetch using pagination
   * Uses offset pagination to get more than 50 tracks
   */
  private getMaxTopTracks(window: string): number {
    switch (window) {
      case '7d': return 50   // Short window, 50 is enough
      case '30d': return 100  // Medium window, get more data
      case '90d': return 150  // Longer window, need more data
      case '180d': return 200 // Long window, maximum we can get (4 pages)
      case '365d': return 200 // Longest window, maximum we can get (4 pages)
      default: return 100
    }
  }

  /**
   * Determines how many top artists to fetch using pagination
   * Uses offset pagination to get more than 50 artists
   */
  private getMaxTopArtists(window: string): number {
    switch (window) {
      case '7d': return 50   // Short window, 50 is enough
      case '30d': return 100  // Medium window, get more data
      case '90d': return 150  // Longer window, need more data
      case '180d': return 200 // Long window, maximum we can get (4 pages)
      case '365d': return 200 // Longest window, maximum we can get (4 pages)
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

      // Get user ID for backend API calls
      const user = await spotifyWebAPI.getCurrentUser().catch(() => null)
      const spotifyUserId = user?.id

      console.log(`🕒 Time segment analysis for "${window}" window`)

      // Fetch real-time and historical data
      const maxRecentTracks = this.getMaxRecentTracks(window)
      
      const [recentTracksArray, historicalTracks] = await Promise.all([
        spotifyWebAPI.getRecentlyPlayedMultiple(maxRecentTracks).catch(() => []),
        spotifyUserId 
          ? backendAPI.getHistoricalTracks(spotifyUserId, window).catch(() => [])
          : Promise.resolve([])
      ])

      console.log(`📊 Fetched ${recentTracksArray.length} recent tracks and ${historicalTracks.length} historical tracks`)

      // Merge real-time and historical data using DataMerger
      const mergedRecords = dataMerger.mergePlayRecords(
        recentTracksArray,
        historicalTracks,
        window
      )
      
      console.log(`📊 Merged ${mergedRecords.length} play records for time segment analysis`)

      // Group by time segment
      const timeSegments = {
        morning: { label: '早上 (6:00-12:00)', tracks: [] as any[], artists: new Map<string, number>() },
        afternoon: { label: '下午 (12:00-18:00)', tracks: [] as any[], artists: new Map<string, number>() },
        evening: { label: '晚上 (18:00-24:00)', tracks: [] as any[], artists: new Map<string, number>() },
        night: { label: '半夜 (0:00-6:00)', tracks: [] as any[], artists: new Map<string, number>() }
      }

      mergedRecords.forEach(record => {
        const playedAt = new Date(record.playedAt)
        const hour = playedAt.getHours()
        
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
          id: record.trackId,
          name: record.trackName,
          artist: record.artistName,
          album: record.albumName,
          imageUrl: record.albumImageUrl,
          playedAt: playedAt.toISOString()
        })

        // Count artists
        const artistCount = timeSegments[segment].artists.get(record.artistName) || 0
        timeSegments[segment].artists.set(record.artistName, artistCount + 1)
      })

      const totalTracks = mergedRecords.length
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
          isEstimated: false, // All data is actual play records
          actualDataPoints: totalTracks
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
