/**
 * Verify database tables and constraints
 */

import pool from '@/server/config/database'

async function verifyTables() {
  try {
    console.log('🔍 Verifying database tables and constraints...\n')

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'play_history', 'daily_stats', 'weekly_stats')
      ORDER BY table_name
    `
    const tablesResult = await pool.query(tablesQuery)
    const existingTables = tablesResult.rows.map(r => r.table_name)
    
    console.log('📊 Existing tables:')
    existingTables.forEach(table => console.log(`  ✅ ${table}`))
    
    if (existingTables.length < 4) {
      const missing = ['users', 'play_history', 'daily_stats', 'weekly_stats']
        .filter(t => !existingTables.includes(t))
      console.log(`\n❌ Missing tables: ${missing.join(', ')}`)
    }

    // Check play_history constraints
    if (existingTables.includes('play_history')) {
      console.log('\n🔍 Checking play_history constraints...')
      
      const constraintsQuery = `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint
        WHERE conrelid = 'play_history'::regclass
        AND contype IN ('u', 'p')
      `
      const constraintsResult = await pool.query(constraintsQuery)
      
      console.log('📋 Constraints on play_history:')
      if (constraintsResult.rows.length === 0) {
        console.log('  ⚠️  No unique constraints found!')
        console.log('  This is required for ON CONFLICT to work.')
      } else {
        constraintsResult.rows.forEach(constraint => {
          console.log(`  ✅ ${constraint.constraint_name}: ${constraint.constraint_definition}`)
        })
      }

      // Check indexes
      const indexesQuery = `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'play_history'
      `
      const indexesResult = await pool.query(indexesQuery)
      
      console.log('\n📇 Indexes on play_history:')
      if (indexesResult.rows.length === 0) {
        console.log('  ⚠️  No indexes found!')
      } else {
        indexesResult.rows.forEach(index => {
          console.log(`  ✅ ${index.indexname}`)
        })
      }

      // Check row count
      const countQuery = `SELECT COUNT(*) as count FROM play_history`
      const countResult = await pool.query(countQuery)
      console.log(`\n📊 Total rows in play_history: ${countResult.rows[0].count}`)
    }

    // Check users table
    if (existingTables.includes('users')) {
      const usersCountQuery = `SELECT COUNT(*) as count FROM users`
      const usersCountResult = await pool.query(usersCountQuery)
      console.log(`\n📊 Total users: ${usersCountResult.rows[0].count}`)
    }

    console.log('\n✅ Verification completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

verifyTables()

