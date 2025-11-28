import pool from '@/server/config/database'

export interface DailyStats {
  id?: number
  user_id: string
  date: Date
  total_plays: number
  total_minutes: number
  unique_tracks: number
  unique_artists: number
  unique_albums: number
  created_at?: Date
  updated_at?: Date
}

export class DailyStatsModel {
  /**
   * Calculate and upsert daily stats for a user and date
   */
  static async calculateAndUpsert(userId: string, date: Date): Promise<DailyStats> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Calculate stats from play_history
    const statsQuery = `
      SELECT 
        COUNT(*) as total_plays,
        COALESCE(SUM(duration_ms) / 60000.0, 0) as total_minutes,
        COUNT(DISTINCT track_id) as unique_tracks,
        COUNT(DISTINCT artist_id) as unique_artists,
        COUNT(DISTINCT album_id) as unique_albums
      FROM play_history
      WHERE user_id = $1 AND played_at >= $2 AND played_at <= $3
    `
    const statsResult = await pool.query(statsQuery, [userId, startOfDay, endOfDay])
    const stats = statsResult.rows[0]

    // Upsert daily stats
    const upsertQuery = `
      INSERT INTO daily_stats (
        user_id, date, total_plays, total_minutes,
        unique_tracks, unique_artists, unique_albums, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        total_plays = EXCLUDED.total_plays,
        total_minutes = EXCLUDED.total_minutes,
        unique_tracks = EXCLUDED.unique_tracks,
        unique_artists = EXCLUDED.unique_artists,
        unique_albums = EXCLUDED.unique_albums,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const values = [
      userId,
      date,
      parseInt(stats.total_plays || '0'),
      parseFloat(stats.total_minutes || '0'),
      parseInt(stats.unique_tracks || '0'),
      parseInt(stats.unique_artists || '0'),
      parseInt(stats.unique_albums || '0')
    ]

    const result = await pool.query(upsertQuery, values)
    return result.rows[0]
  }

  /**
   * Get daily stats for a user within a date range
   */
  static async getByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> {
    const query = `
      SELECT * FROM daily_stats
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date DESC
    `
    const result = await pool.query(query, [userId, startDate, endDate])
    return result.rows
  }

  /**
   * Get daily stats for a user within a time window (alias for getByUserAndDateRange)
   */
  static async getByUserAndWindow(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> {
    return this.getByUserAndDateRange(userId, startDate, endDate)
  }
}

