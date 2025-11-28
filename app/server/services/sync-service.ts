import axios from 'axios'
import { UserModel } from '@/server/models/User'
import { PlayHistoryModel } from '@/server/models/PlayHistory'
import { DailyStatsModel } from '@/server/models/DailyStats'

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: { id: string; name: string; images?: Array<{ url: string }> }
  duration_ms: number
  popularity: number
}

interface SpotifyRecentlyPlayedTrack {
  track: SpotifyTrack
  played_at: string
}

interface SpotifyRecentlyPlayedResponse {
  items: SpotifyRecentlyPlayedTrack[]
  cursors?: {
    before?: string
    after?: string
  }
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[]
}

interface SpotifyTopArtistsResponse {
  items: Array<{
    id: string
    name: string
  }>
}

/**
 * Refresh Spotify access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client credentials not configured')
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      }
    }
  )

  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in
  }
}

/**
 * Fetch recently played tracks from Spotify API
 */
async function fetchRecentlyPlayed(accessToken: string, limit: number = 50, before?: number): Promise<SpotifyRecentlyPlayedResponse> {
  const params = new URLSearchParams({ limit: limit.toString() })
  if (before) {
    params.append('before', before.toString())
  }

  const response = await axios.get<SpotifyRecentlyPlayedResponse>(
    `https://api.spotify.com/v1/me/player/recently-played?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  return response.data
}

/**
 * Fetch top tracks from Spotify API with pagination
 */
async function fetchTopTracks(accessToken: string, timeRange: string = 'medium_term', limit: number = 50, offset: number = 0): Promise<SpotifyTopTracksResponse> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: limit.toString(),
    offset: offset.toString()
  })

  const response = await axios.get<SpotifyTopTracksResponse>(
    `https://api.spotify.com/v1/me/top/tracks?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  return response.data
}

/**
 * Sync user data from Spotify API
 */
export async function syncUserData(spotifyUserId: string): Promise<{
  recentlyPlayedCount: number
  topTracksCount: number
  newRecords: number
}> {
  // Get user from database
  const user = await UserModel.findBySpotifyId(spotifyUserId)
  if (!user || !user.refresh_token) {
    throw new Error('User not found or no refresh token available')
  }

  // Refresh access token if needed
  let accessToken = user.access_token
  const tokenExpiresAt = user.token_expires_at ? new Date(user.token_expires_at) : null

  if (!accessToken || (tokenExpiresAt && tokenExpiresAt <= new Date())) {
    console.log(`🔄 Refreshing token for user ${spotifyUserId}`)
    const tokenData = await refreshAccessToken(user.refresh_token!)
    accessToken = tokenData.access_token
    
    // Update tokens in database
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
    await UserModel.updateTokens(spotifyUserId, accessToken, user.refresh_token!, expiresAt)
  }

  // Get latest play time from database
  const latestPlayTime = await PlayHistoryModel.getLatestPlayTime(spotifyUserId)
  const afterTimestamp = latestPlayTime ? Math.floor(latestPlayTime.getTime()) : undefined
  
  if (latestPlayTime) {
    console.log(`⏰ Latest play time in DB: ${latestPlayTime.toISOString()}`)
    console.log(`📅 Will only sync tracks played after: ${new Date(afterTimestamp!).toISOString()}`)
  } else {
    console.log(`📅 No previous sync found - will sync all recent tracks`)
  }

  // Fetch recently played tracks (up to 50, which is API limit)
  console.log(`📡 Fetching recently played tracks for user ${spotifyUserId}`)
  const recentlyPlayedResponse = await fetchRecentlyPlayed(accessToken, 50)
  const recentlyPlayedTracks = recentlyPlayedResponse.items || []
  console.log(`📊 Fetched ${recentlyPlayedTracks.length} recently played tracks`)

  // Convert to play history records
  const playHistoryRecords = recentlyPlayedTracks
    .filter(item => {
      // Only include tracks played after the latest sync
      if (afterTimestamp) {
        const playedAt = new Date(item.played_at).getTime()
        return playedAt > afterTimestamp
      }
      return true
    })
    .map(item => ({
      user_id: spotifyUserId,
      track_id: item.track.id,
      track_name: item.track.name,
      artist_id: item.track.artists[0]?.id,
      artist_name: item.track.artists[0]?.name || 'Unknown',
      album_id: item.track.album.id,
      album_name: item.track.album.name,
      played_at: new Date(item.played_at),
      duration_ms: item.track.duration_ms,
      popularity: item.track.popularity
    }))

  console.log(`📝 Prepared ${playHistoryRecords.length} play history records to insert`)
  if (afterTimestamp) {
    console.log(`⏰ Filtering records after ${new Date(afterTimestamp).toISOString()}`)
  }

  // Insert play history records (with deduplication)
  const newRecords = await PlayHistoryModel.insertMany(playHistoryRecords)
  console.log(`✅ Inserted ${newRecords} new play history records (${playHistoryRecords.length - newRecords} were duplicates or skipped)`)

  // Fetch top tracks for additional data (using pagination to get more)
  console.log(`📡 Fetching top tracks for user ${spotifyUserId}`)
  let topTracksCount = 0
  try {
    // Fetch multiple pages of top tracks
    const allTopTracks: SpotifyTrack[] = []
    for (let offset = 0; offset < 200; offset += 50) {
      const response = await fetchTopTracks(accessToken, 'medium_term', 50, offset)
      if (!response.items || response.items.length === 0) break
      allTopTracks.push(...response.items)
      if (response.items.length < 50) break // No more pages
    }
    topTracksCount = allTopTracks.length
  } catch (error) {
    console.error('Error fetching top tracks:', error)
  }

  // Calculate daily stats for today
  const today = new Date()
  await DailyStatsModel.calculateAndUpsert(spotifyUserId, today)

  // Update last sync timestamp
  await UserModel.updateLastSync(spotifyUserId)

  return {
    recentlyPlayedCount: recentlyPlayedTracks.length,
    topTracksCount,
    newRecords
  }
}

/**
 * Sync data for all active users
 */
export async function syncAllUsers(): Promise<void> {
  console.log('🔄 Starting sync for all active users...')
  const activeUsers = await UserModel.getActiveUsers()
  console.log(`📊 Found ${activeUsers.length} active users`)

  for (const user of activeUsers) {
    try {
      console.log(`\n🔄 Syncing user: ${user.spotify_user_id}`)
      await syncUserData(user.spotify_user_id)
      console.log(`✅ Completed sync for user: ${user.spotify_user_id}`)
      
      // Rate limiting: wait between users
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`❌ Error syncing user ${user.spotify_user_id}:`, error.message)
    }
  }

  console.log('\n✅ Sync completed for all users')
}

