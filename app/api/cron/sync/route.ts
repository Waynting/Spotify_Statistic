import { NextRequest, NextResponse } from 'next/server'
import { syncAllUsers } from '@/server/services/sync-service'

/**
 * GET /api/cron/sync
 * Vercel Cron Job - Sync all users' Spotify data daily
 *
 * This endpoint is called by Vercel Cron every day at midnight UTC
 * It fetches the latest play history for all registered users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this header automatically)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('🕐 Cron job started:', new Date().toISOString())

    // Run sync for all users
    await syncAllUsers()

    console.log('✅ Cron job completed:', new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Vercel Cron configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time
