/**
 * Database migration script
 * Run this to ensure all tables and constraints are created
 */

import pool from '@/server/config/database'
import fs from 'fs'
import path from 'path'

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n')
    
    const migrationFile = path.join(process.cwd(), 'app/server/migrations/001_create_tables.sql')
    const sql = fs.readFileSync(migrationFile, 'utf-8')
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        await pool.query(statement)
        console.log('✅ Executed:', statement.substring(0, 60) + '...')
        successCount++
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.code === '42P07' || 
            error.code === '23505' ||
            error.message.includes('duplicate')) {
          console.log('ℹ️  Already exists:', statement.substring(0, 60) + '...')
          skippedCount++
        } else {
          console.error('❌ Error executing statement:', error.message)
          console.error('Code:', error.code)
          console.error('Statement:', statement.substring(0, 150))
          errorCount++
          // Don't throw - continue with other statements
        }
      }
    }
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ℹ️  Skipped (already exists): ${skippedCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n✅ All migrations completed successfully!')
    } else {
      console.log('\n⚠️  Some migrations had errors, but continuing...')
    }
    
    // Verify tables
    console.log('\n🔍 Verifying tables...')
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'play_history', 'daily_stats', 'weekly_stats')
      ORDER BY table_name
    `
    const tablesResult = await pool.query(tablesQuery)
    const existingTables = tablesResult.rows.map(r => r.table_name)
    
    console.log('📊 Existing tables:', existingTables.join(', '))
    
    // Check play_history unique constraint
    if (existingTables.includes('play_history')) {
      const constraintQuery = `
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'play_history'::regclass
        AND contype = 'u'
      `
      const constraintResult = await pool.query(constraintQuery)
      if (constraintResult.rows.length > 0) {
        console.log('✅ play_history unique constraint exists:', constraintResult.rows[0].conname)
      } else {
        console.log('⚠️  play_history unique constraint missing!')
        console.log('   This is required for ON CONFLICT to work.')
      }
    }
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

runMigrations()

