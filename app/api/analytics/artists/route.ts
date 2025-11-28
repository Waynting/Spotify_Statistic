import { NextRequest, NextResponse } from 'next/server'
import { PlayHistoryModel } from '@/server/models/PlayHistory'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/artists?window=30d
 * Get historical artist play data for analytics
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

    // Get play history
    const playHistory = await PlayHistoryModel.getByUserAndWindow(
      spotifyUserId,
      startDate,
      endDate
    )

    // Aggregate by artist
    const artistMap = new Map<string, {
      artist_id: string
      artist_name: string
      plays: number
      minutes: number
    }>()

    playHistory.forEach(record => {
      if (!record.artist_id || !record.artist_name) return

      const existing = artistMap.get(record.artist_id)
      if (existing) {
        existing.plays += 1
        existing.minutes += (record.duration_ms || 0) / 1000 / 60
      } else {
        artistMap.set(record.artist_id, {
          artist_id: record.artist_id,
          artist_name: record.artist_name,
          plays: 1,
          minutes: (record.duration_ms || 0) / 1000 / 60
        })
      }
    })

    const artists = Array.from(artistMap.values())
      .sort((a, b) => b.plays - a.plays)

    return NextResponse.json({
      window,
      artists,
      total_artists: artists.length,
      total_plays: artists.reduce((sum, a) => sum + a.plays, 0)
    })
  } catch (error) {
    console.error('Error in /api/analytics/artists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

