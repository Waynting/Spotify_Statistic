# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a Spotify analytics application that works in two environments:
1. **Web Version**: React + TypeScript + Vite web app with Spotify OAuth
2. **Desktop Version**: Tauri app with Rust backend (currently disabled - focus on web version)

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Authentication**: Spotify OAuth 2.0 with PKCE flow
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes with shadcn-style CSS variables

### Core Features
1. **唱片櫃 (Album Shelf)**: Visual grid of top albums with time window filtering (7d/一個月/180d/365d)
2. **聆聽分析 (Analytics)**: Charts and rankings for tracks, albums, artists, and genres
3. **歌單匯入 (Crates)**: Import and manage Spotify playlists
4. **設定 (Settings)**: One-click Spotify authentication and account management

## Development Commands

```bash
# Install dependencies
npm install

# Run web development server (port 8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run Tauri desktop app (currently disabled)
npm run tauri dev
```

## Authentication Architecture

The app uses standard Spotify OAuth 2.0 with PKCE:
- Authentication starts in `src/components/Settings.tsx` → "連接 Spotify" button
- OAuth flow handled by `src/lib/spotify-web-api.ts`
- Callback processed in `src/components/SpotifyCallback.tsx`
- Tokens stored in localStorage with automatic refresh

Key files:
- `src/lib/config.ts`: Environment configuration and client ID management
- `src/lib/spotify-web-api.ts`: Main Spotify API client with OAuth implementation
- `src/lib/api.ts`: Tauri backend API (for desktop version)

## Environment Configuration

Required `.env` file:
```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id
VITE_SPOTIFY_REDIRECT_URI_WEB=http://127.0.0.1:8000/callback
VITE_SPOTIFY_REDIRECT_URI_DESKTOP=http://127.0.0.1:8001/callback
```

## Data Flow

1. **Authentication**: User clicks connect → OAuth redirect → Callback → Store tokens
2. **Data Fetching**: Components use `dataService.ts` → Checks cache → Falls back to Spotify API
3. **State Management**: 
   - Auth state in `useAuthStore` (Zustand)
   - Data cached in localStorage with TTL
   - UI state managed locally in components

## Important UI/UX Decisions

- **Chinese UI**: All user-facing text is in Traditional Chinese
- **Time Windows**: "7天", "一個月", "180天", "365天" (not "兩年")
- **No Demo Mode**: Removed all demo/fake data - requires real Spotify connection
- **Error Handling**: PKCE parameters regenerated on each auth attempt
- **One-Click Auth**: No manual client ID input for users

## Testing OAuth

When testing authentication:
1. Ensure PKCE parameters are cleared on each attempt (handled automatically)
2. Check redirect URI matches exactly (including port)
3. Verify client ID is correctly set in environment
4. Use "重試連接" button on auth failure

## Deployment Notes

For production deployment:
1. Set `VITE_SPOTIFY_CLIENT_ID` in deployment environment
2. Update redirect URIs in Spotify App settings to match production URL
3. The app handles token refresh automatically
4. Client ID is public (safe for frontend) - no client secret needed with PKCE