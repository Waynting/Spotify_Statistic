/**
 * Test sync functionality - manually trigger sync for debugging
 */

import { syncUserData } from '@/server/services/sync-service'
import { UserModel } from '@/server/models/User'
import pool from '@/server/config/database'

async function testSync() {
  try {
    console.log('🧪 Testing sync functionality...\n')

    // Get first user
    const users = await UserModel.getActiveUsers()
    if (users.length === 0) {
      console.error('❌ No users found in database')
      process.exit(1)
    }

    const user = users[0]
    console.log(`👤 Testing sync for user: ${user.spotify_user_id}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
    console.log(`   Display Name: ${user.display_name || 'N/A'}`)
    console.log(`   Has Refresh Token: ${!!user.refresh_token}`)
    console.log(`   Last Sync: ${user.last_sync_at ? new Date(user.last_sync_at).toISOString() : 'Never'}\n`)

    // Check current play_history count
    const beforeCount = await pool.query('SELECT COUNT(*) as count FROM play_history WHERE user_id = $1', [user.spotify_user_id])
    console.log(`📊 Current play_history records: ${beforeCount.rows[0].count}\n`)

    // Run sync
    console.log('🔄 Starting sync...\n')
    const result = await syncUserData(user.spotify_user_id)

    console.log('\n📊 Sync Results:')
    console.log(`   Recently Played Tracks Fetched: ${result.recentlyPlayedCount}`)
    console.log(`   Top Tracks Fetched: ${result.topTracksCount}`)
    console.log(`   New Records Inserted: ${result.newRecords}`)

    // Check play_history count after sync
    const afterCount = await pool.query('SELECT COUNT(*) as count FROM play_history WHERE user_id = $1', [user.spotify_user_id])
    console.log(`\n📊 play_history records after sync: ${afterCount.rows[0].count}`)
    console.log(`   Added: ${parseInt(afterCount.rows[0].count) - parseInt(beforeCount.rows[0].count)}`)

    await pool.end()
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Sync test failed:', error)
    console.error('Error stack:', error.stack)
    await pool.end()
    process.exit(1)
  }
}

testSync()

