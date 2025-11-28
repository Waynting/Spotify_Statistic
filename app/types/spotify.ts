/**
 * Comprehensive Spotify Web API TypeScript definitions
 * Based on Spotify Web API Reference
 */

// Core Spotify Object Types
export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyExternalUrls {
  spotify: string
}

export interface SpotifyFollowers {
  href: string | null
  total: number
}

export interface SpotifyOwner {
  external_urls: SpotifyExternalUrls
  followers?: SpotifyFollowers
  href: string
  id: string
  type: 'user'
  uri: string
  display_name?: string
}

// Artist Types
export interface SpotifyArtist {
  external_urls: SpotifyExternalUrls
  followers?: SpotifyFollowers
  genres: string[]
  href: string
  id: string
  images: SpotifyImage[]
  name: string
  popularity: number
  type: 'artist'
  uri: string
}

export interface SpotifySimplifiedArtist {
  external_urls: SpotifyExternalUrls
  href: string
  id: string
  name: string
  type: 'artist'
  uri: string
}

// Album Types
export interface SpotifyAlbum {
  album_type: 'album' | 'single' | 'compilation'
  total_tracks: number
  available_markets: string[]
  external_urls: SpotifyExternalUrls
  href: string
  id: string
  images: SpotifyImage[]
  name: string
  release_date: string
  release_date_precision: 'year' | 'month' | 'day'
  restrictions?: {
    reason: string
  }
  type: 'album'
  uri: string
  artists: SpotifySimplifiedArtist[]
}

export interface SpotifySimplifiedAlbum {
  album_type: 'album' | 'single' | 'compilation'
  total_tracks: number
  available_markets: string[]
  external_urls: SpotifyExternalUrls
  href: string
  id: string
  images: SpotifyImage[]
  name: string
  release_date: string
  release_date_precision: 'year' | 'month' | 'day'
  type: 'album'
  uri: string
  artists: SpotifySimplifiedArtist[]
}

// Track Types
export interface SpotifyTrack {
  album: SpotifySimplifiedAlbum
  artists: SpotifyArtist[]
  available_markets: string[]
  disc_number: number
  duration_ms: number
  explicit: boolean
  external_ids: {
    isrc?: string
    ean?: string
    upc?: string
  }
  external_urls: SpotifyExternalUrls
  href: string
  id: string
  is_playable?: boolean
  linked_from?: object
  restrictions?: {
    reason: string
  }
  name: string
  popularity: number
  preview_url: string | null
  track_number: number
  type: 'track'
  uri: string
  is_local: boolean
}

export interface SpotifySimplifiedTrack {
  artists: SpotifySimplifiedArtist[]
  available_markets: string[]
  disc_number: number
  duration_ms: number
  explicit: boolean
  external_urls: SpotifyExternalUrls
  href: string
  id: string
  is_playable?: boolean
  linked_from?: object
  restrictions?: {
    reason: string
  }
  name: string
  preview_url: string | null
  track_number: number
  type: 'track'
  uri: string
  is_local: boolean
}

// Playback Types
export interface SpotifyDevice {
  id: string | null
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number | null
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
  context: {
    type: 'artist' | 'playlist' | 'album' | 'show'
    href: string
    external_urls: SpotifyExternalUrls
    uri: string
  } | null
  timestamp: number
  progress_ms: number | null
  is_playing: boolean
  item: SpotifyTrack | null
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown'
  actions: {
    interrupting_playback?: boolean
    pausing?: boolean
    resuming?: boolean
    seeking?: boolean
    skipping_next?: boolean
    skipping_prev?: boolean
    toggling_repeat_context?: boolean
    toggling_shuffle?: boolean
    toggling_repeat_track?: boolean
    transferring_playback?: boolean
  }
}

// API Response Types
export interface SpotifyPagingObject<T> {
  href: string
  items: T[]
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[]
  total: number
  limit: number
  offset: number
  href: string
  next: string | null
  previous: string | null
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[]
  total: number
  limit: number
  offset: number
  href: string
  next: string | null
  previous: string | null
}

export interface SpotifyRecentlyPlayedTrack {
  track: SpotifyTrack
  played_at: string
  context: {
    type: 'artist' | 'playlist' | 'album' | 'show'
    href: string
    external_urls: SpotifyExternalUrls
    uri: string
  } | null
}

export interface SpotifyRecentlyPlayedResponse {
  items: SpotifyRecentlyPlayedTrack[]
  next: string | null
  cursors: {
    after: string
    before: string
  }
  limit: number
  href: string
}

// User Types
export interface SpotifyUser {
  country?: string
  display_name: string | null
  email?: string
  explicit_content?: {
    filter_enabled: boolean
    filter_locked: boolean
  }
  external_urls: SpotifyExternalUrls
  followers: SpotifyFollowers
  href: string
  id: string
  images: SpotifyImage[]
  product?: 'premium' | 'free' | 'open'
  type: 'user'
  uri: string
}

// Audio Features
export interface SpotifyAudioFeatures {
  danceability: number
  energy: number
  key: number
  loudness: number
  mode: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
  type: 'audio_features'
  id: string
  uri: string
  track_href: string
  analysis_url: string
  duration_ms: number
  time_signature: number
}

// Token Types
export interface SpotifyTokenResponse {
  access_token: string
  token_type: 'Bearer'
  scope: string
  expires_in: number
  refresh_token?: string
}

// Error Types
export interface SpotifyError {
  error: {
    status: number
    message: string
  }
}

// Time Range Types
export type SpotifyTimeRange = 'short_term' | 'medium_term' | 'long_term'

// App-specific Analytics Types
export interface AnalyticsTrackData {
  id: string
  name: string
  artist: string
  album: string
  plays: number
  duration: number // in minutes
  popularity: number
  imageUrl?: string
}

export interface AnalyticsAlbumData {
  id: string
  album_name: string
  artist: string
  plays: number
  minutes: number
  last_played: number
  album_image?: string
}

export interface AnalyticsArtistData {
  id: string
  name: string
  genres: string[]
  followers: number
  popularity: number
  plays: number
  minutes?: number
  imageUrl?: string
}

export interface AnalyticsGenreData {
  name: string
  count: number
  percentage: number
}

export interface TimeSegmentData {
  segment: 'morning' | 'afternoon' | 'evening' | 'night'
  label: string
  totalTracks: number
  tracks: {
    id: string
    name: string
    artist: string
    album: string
    imageUrl?: string
    playedAt: string
  }[]
  topArtists: {
    name: string
    count: number
  }[]
  percentage: number
}

// Data Source Indicator
export interface DataSourceInfo {
  source: 'spotify' | 'demo' | 'cache'
  timestamp: number
  isOnline: boolean
  hasValidToken: boolean
  isEstimated?: boolean // Indicates if play counts are estimated
  actualDataPoints?: number // Number of actual data points used
  hasSimulatedData?: boolean // Indicates if time data is simulated
  apiLimitations?: string[] // List of API limitations affecting this data
}

export interface AnalyticsResponse<T> {
  data: T[]
  sourceInfo: DataSourceInfo
}