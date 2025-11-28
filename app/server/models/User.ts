import pool from '@/server/config/database'

export interface User {
  spotify_user_id: string
  email?: string
  display_name?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: Date
  created_at?: Date
  updated_at?: Date
  last_sync_at?: Date
}

export class UserModel {
  /**
   * Create or update a user
   */
  static async upsert(user: User): Promise<User> {
    const query = `
      INSERT INTO users (
        spotify_user_id, email, display_name, access_token, 
        refresh_token, token_expires_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (spotify_user_id) 
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    
    const values = [
      user.spotify_user_id,
      user.email || null,
      user.display_name || null,
      user.access_token || null,
      user.refresh_token || null,
      user.token_expires_at || null
    ]
    
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * Get user by Spotify user ID
   */
  static async findBySpotifyId(spotifyUserId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE spotify_user_id = $1'
    const result = await pool.query(query, [spotifyUserId])
    return result.rows[0] || null
  }

  /**
   * Update user tokens
   */
  static async updateTokens(
    spotifyUserId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<void> {
    const query = `
      UPDATE users 
      SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = CURRENT_TIMESTAMP
      WHERE spotify_user_id = $4
    `
    await pool.query(query, [accessToken, refreshToken, expiresAt, spotifyUserId])
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(spotifyUserId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE spotify_user_id = $1
    `
    await pool.query(query, [spotifyUserId])
  }

  /**
   * Get all active users (users with valid tokens)
   */
  static async getActiveUsers(): Promise<User[]> {
    const query = `
      SELECT * FROM users 
      WHERE refresh_token IS NOT NULL 
      AND (token_expires_at IS NULL OR token_expires_at > CURRENT_TIMESTAMP)
    `
    const result = await pool.query(query)
    return result.rows
  }
}

