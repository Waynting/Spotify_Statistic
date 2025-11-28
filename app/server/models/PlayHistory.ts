import pool from '@/server/config/database'

export interface PlayHistoryRecord {
  id?: number
  user_id: string
  track_id: string
  track_name: string
  artist_id?: string
  artist_name?: string
  album_id?: string
  album_name?: string
  played_at: Date
  duration_ms?: number
  popularity?: number
  created_at?: Date
}

export class PlayHistoryModel {
  /**
   * Insert play history records (with deduplication)
   */
  static async insertMany(records: PlayHistoryRecord[]): Promise<number> {
    if (records.length === 0) return 0

    const query = `
      INSERT INTO play_history (
        user_id, track_id, track_name, artist_id, artist_name,
        album_id, album_name, played_at, duration_ms, popularity
      )
      VALUES ${records.map((_, i) => 
        `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, 
         $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
      ).join(', ')}
      ON CONFLICT (user_id, track_id, played_at) DO NOTHING
    `

    const values = records.flatMap(record => [
      record.user_id,
      record.track_id,
      record.track_name,
      record.artist_id || null,
      record.artist_name || null,
      record.album_id || null,
      record.album_name || null,
      record.played_at,
      record.duration_ms || null,
      record.popularity || null
    ])

    const result = await pool.query(query, values)
    return result.rowCount || 0
  }

  /**
   * Get play history for a user within a time window
   */
  static async getByUserAndWindow(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PlayHistoryRecord[]> {
    const query = `
      SELECT * FROM play_history
      WHERE user_id = $1 AND played_at >= $2 AND played_at <= $3
      ORDER BY played_at DESC
    `
    const result = await pool.query(query, [userId, startDate, endDate])
    return result.rows
  }

  /**
   * Get latest play timestamp for a user
   */
  static async getLatestPlayTime(userId: string): Promise<Date | null> {
    const query = `
      SELECT MAX(played_at) as latest_play
      FROM play_history
      WHERE user_id = $1
    `
    const result = await pool.query(query, [userId])
    return result.rows[0]?.latest_play || null
  }

  /**
   * Count plays for a track within a time window
   */
  static async countTrackPlays(
    userId: string,
    trackId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM play_history
      WHERE user_id = $1 AND track_id = $2 
      AND played_at >= $3 AND played_at <= $4
    `
    const result = await pool.query(query, [userId, trackId, startDate, endDate])
    return parseInt(result.rows[0]?.count || '0')
  }
}

