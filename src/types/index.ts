export interface AlbumRow {
  album_id: string
  album_name: string
  album_image?: string
  plays: number
  minutes?: number
  last_played?: number
}

export interface Device {
  id: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent?: number
}

export interface SpotifyImage {
  url: string
  height?: number
  width?: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres?: string[]
  images?: SpotifyImage[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: SpotifyArtist[]
  images: SpotifyImage[]
  release_date?: string
}

export interface SpotifyTrack {
  id: string
  name: string
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  duration_ms: number
  explicit: boolean
}

export interface Crate {
  id: string
  name: string
  owner: string
  type: 'album' | 'artist' | 'playlist' | 'track' | 'mixed'
  cover_mode: 'mosaic' | 'first' | 'auto'
  created_at: number
  updated_at: number
}

export interface CrateItem {
  id: number
  crate_id: string
  kind: 'album' | 'artist' | 'playlist' | 'track'
  entity_id: string
  position: number
  added_at: number
}