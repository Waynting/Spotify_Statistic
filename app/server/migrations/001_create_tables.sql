-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  spotify_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create play_history table
CREATE TABLE IF NOT EXISTS play_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  track_id VARCHAR(255) NOT NULL,
  track_name VARCHAR(500),
  artist_id VARCHAR(255),
  artist_name VARCHAR(500),
  album_id VARCHAR(255),
  album_name VARCHAR(500),
  played_at TIMESTAMP NOT NULL,
  duration_ms INTEGER,
  popularity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT play_history_unique UNIQUE (user_id, track_id, played_at)
);

-- Create daily_stats table
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_plays INTEGER DEFAULT 0,
  total_minutes DECIMAL(10, 2) DEFAULT 0,
  unique_tracks INTEGER DEFAULT 0,
  unique_artists INTEGER DEFAULT 0,
  unique_albums INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT daily_stats_unique UNIQUE (user_id, date)
);

-- Create weekly_stats table (if needed)
CREATE TABLE IF NOT EXISTS weekly_stats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  week_start DATE NOT NULL,
  total_plays INTEGER DEFAULT 0,
  total_minutes DECIMAL(10, 2) DEFAULT 0,
  unique_tracks INTEGER DEFAULT 0,
  unique_artists INTEGER DEFAULT 0,
  unique_albums INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weekly_stats_unique UNIQUE (user_id, week_start)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at);
CREATE INDEX IF NOT EXISTS idx_play_history_user_played ON play_history(user_id, played_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON weekly_stats(user_id, week_start);

