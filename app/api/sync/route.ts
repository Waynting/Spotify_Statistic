import { NextRequest, NextResponse } from 'next/server'
import { syncUserData } from '@/server/services/sync-service'

/**
 * POST /api/sync
 * Manually trigger data synchronization for a user
 */
export async function POST(request: NextRequest) {
  try {
    const spotifyUserId = request.headers.get('x-spotify-user-id')

    if (!spotifyUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Trigger sync
    const result = await syncUserData(spotifyUserId)

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      ...result
    })
  } catch (error: any) {
    console.error('Error in /api/sync:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        message: error.message 
      },
      { status: 500 }
    )
  }
}

