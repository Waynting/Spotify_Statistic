import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/server/models/User'

/**
 * POST /api/auth/spotify
 * Register or update user with Spotify OAuth tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spotify_user_id, email, display_name, access_token, refresh_token, expires_in } = body

    if (!spotify_user_id || !access_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate token expiration time
    const tokenExpiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000) // Default 1 hour

    const user = await UserModel.upsert({
      spotify_user_id,
      email,
      display_name,
      access_token,
      refresh_token,
      token_expires_at: tokenExpiresAt
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        spotify_user_id: user.spotify_user_id,
        email: user.email,
        display_name: user.display_name
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/spotify:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Export OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

