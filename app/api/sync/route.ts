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
      console.error('❌ /api/sync: Missing x-spotify-user-id header')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`🔄 /api/sync: Starting sync for user ${spotifyUserId}`)

    // Trigger sync
    const result = await syncUserData(spotifyUserId)

    console.log(`✅ /api/sync: Completed sync for user ${spotifyUserId}`, result)

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      ...result
    })
  } catch (error: any) {
    console.error('❌ Error in /api/sync:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

