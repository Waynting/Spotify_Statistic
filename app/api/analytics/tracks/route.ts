import { NextRequest, NextResponse } from 'next/server'
import { PlayHistoryModel } from '@/server/models/PlayHistory'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/tracks?window=30d
 * Get historical track play data for analytics
 */
export async function GET(request: NextRequest) {
  try {
    const spotifyUserId = request.headers.get('x-spotify-user-id')
    const { searchParams } = new URL(request.url)
    const window = searchParams.get('window') || '30d'

    if (!spotifyUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate time window
    const endDate = new Date()
    const startDate = new Date()
    
    switch (window) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '180d':
        startDate.setDate(startDate.getDate() - 180)
        break
      case '365d':
        startDate.setDate(startDate.getDate() - 365)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    // Get play history - return raw records, not aggregated
    // This allows frontend to merge with real-time data accurately
    const playHistory = await PlayHistoryModel.getByUserAndWindow(
      spotifyUserId,
      startDate,
      endDate
    )

    // Convert to BackendTrack format (one record per play)
    // Each play_history record represents one play, so we create one BackendTrack per record
    const tracks = playHistory.map(record => ({
      track_id: record.track_id,
      track_name: record.track_name,
      artist_name: record.artist_name || 'Unknown',
      album_name: record.album_name || 'Unknown',
      plays: 1, // Each record is one play
      duration_ms: record.duration_ms || 0,
      popularity: record.popularity || 0,
      last_played: record.played_at.toISOString() // Convert Date to ISO string
    }))

    return NextResponse.json({
      window,
      tracks,
      total_tracks: new Set(tracks.map(t => t.track_id)).size,
      total_plays: tracks.length
    })
  } catch (error) {
    console.error('Error in /api/analytics/tracks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

