import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/server/models/User'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/me
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    const spotifyUserId = request.headers.get('x-spotify-user-id')

    if (!spotifyUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await UserModel.findBySpotifyId(spotifyUserId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      spotify_user_id: user.spotify_user_id,
      email: user.email,
      display_name: user.display_name,
      last_sync_at: user.last_sync_at
    })
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

