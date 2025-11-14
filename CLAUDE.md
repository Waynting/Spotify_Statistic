# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a Spotify analytics application with dual-environment support:
1. **Web Version** (Primary): React + TypeScript + Vite SPA with direct Spotify Web API integration
2. **Desktop Version**: Tauri wrapper with Rust backend (legacy, focus on web version)

The application follows a modular analytics architecture where components are split by analysis type (albums, tracks, artists, genres, time segments) with shared utilities and consistent design patterns.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand (auth state) + TanStack Query (data fetching/caching)
- **Authentication**: Spotify OAuth 2.0 with PKCE flow (web-native, no backend required)
- **Charts**: Recharts with custom theming
- **Icons**: Lucide React
- **Screenshots**: html2canvas for data snapshot generation
- **Styling**: Pure black backgrounds with vibrant accent colors

### Core Features
1. **唱片櫃 (Album Shelf)**: Visual grid with album covers, play counts, time filtering
2. **聆聽分析 (Analytics)**: Modular analysis components for different data types
3. **數據快照 (Data Snapshot)**: Screenshot generation for social sharing with single-selection analysis
4. **設定 (Settings)**: One-click Spotify OAuth integration

## Development Commands

```bash
# Install dependencies
npm install

# Run web development server (port 8000) 
npm run dev

# Build and typecheck for production
npm run build

# Preview production build
npm run preview

# Legacy Tauri desktop mode (avoid using)
npm run tauri dev
```

## Critical Architecture Notes

### Dual Environment Handling
The app uses `src/lib/api.ts` with environment detection (`isTauriApp()`) to handle both web and Tauri environments. Web environment is primary and should return empty arrays for data queries rather than throwing errors.

### Authentication Flow
- Web-first OAuth 2.0 PKCE implementation in `src/lib/spotify-web-api.ts`
- No backend secrets required - client ID is public and safe for frontend
- Tokens stored in localStorage with automatic refresh
- Authentication state managed via `useAuthStore` (Zustand)

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

### Data Service Architecture  
The `DataService` class (`src/lib/data-service.ts`) is the core data layer:
- Handles Spotify API calls with fallback strategies
- Implements intelligent caching via `cacheManager` 
- Processes raw Spotify data into analytics-ready formats
- Maps time windows (7d/30d/180d/365d) to Spotify's time ranges (short/medium/long term)
- Estimates play counts using ranking algorithms when actual data unavailable

### Analytics Component Structure
All analytics components (`src/components/analytics/`) follow consistent patterns:
- Null/undefined data validation with empty state UI
- Shared `StatsCard` components for key metrics
- Recharts integration with consistent theming
- Time window filtering support
- Pure black backgrounds (`bg-black`) with accent colors

### Environment Configuration

Required `.env` file:
```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id
VITE_SPOTIFY_REDIRECT_URI_WEB=http://127.0.0.1:8000/callback
VITE_SPOTIFY_REDIRECT_URI_DESKTOP=http://127.0.0.1:8001/callback
```

### Critical Implementation Details

- **No Demo Mode**: All demo/fake data removed - application requires real Spotify connection
- **Chinese UI**: User-facing text in Traditional Chinese with specific time window labels
- **Array Safety**: All array operations include `Array.isArray()` and `.length` checks
- **Type Safety**: Avoid `as any` - use proper TypeScript interfaces from `src/types/spotify.ts`
- **Pure Black Backgrounds**: All analytics components use `bg-black` for consistency
- **Album Cover Display**: Real Spotify album covers with fallback to disc icons
- **Sun-Themed Colors**: Time segment analysis uses sunrise-to-sunset color spectrum:
  - Morning: `#FFB74D` (warm gold)
  - Afternoon: `#FDD835` (bright yellow)  
  - Evening: `#FF7043` (orange-red)
  - Night: `#7986CB` (soft purple-blue)
- **Dynamic Time Analysis**: Time segment analysis filters data by selected window and enhances with top tracks when recent data insufficient
- **Error Handling**: Web environment commands return empty arrays rather than throwing errors

## Shared Constants and Configuration

### Time Windows (`src/constants/timeWindows.ts`)
Centralized time window configurations prevent inconsistencies across components:
- `TIME_WINDOWS`: Standard options (7d/30d/90d/180d/365d) for most components
- `ANALYTICS_TIME_WINDOWS`: Simplified options (7d/30d/180d/365d) for analytics page
- `DEFAULT_TIME_WINDOW`: Consistent default ('30d') across the application

### Query Key Patterns
TanStack Query keys follow consistent patterns for optimal caching:
- Albums: `['albums', timeWindow]` 
- Analytics: `['analytics', timeWindow, analysisType]`
- Time segments: `['timeSegments', timeWindow]`

## Data Snapshot Architecture

The `DataSnapshot` component (`src/components/DataSnapshot.tsx`) enables social sharing:
- **Single Selection Mode**: Users select ONE analysis type at a time for clean screenshots
- **Dynamic Container Sizing**: Automatically adjusts container dimensions for optimal chart display
- **Screenshot Generation**: Uses html2canvas with optimized settings (scale: 2, black background)
- **Genre Analysis Special Handling**: Larger container (800px width, 700px height) for pie chart visibility

## Critical Implementation Patterns

### Sorting Logic Validation
Always verify sorting after data transformations - Spotify's ranking order may not match actual play counts:
```typescript
// Correct pattern - sort by calculated plays, not API order
return tracksWithPlays.sort((a, b) => b.plays - a.plays)
```

### Genre Translation System
Western music genres get Chinese labels for better UX:
```typescript
// Pattern in GenresAnalysis.tsx
function getGenreLabel(genreName: string): string {
  // Returns format: "流行 (pop)" for translated genres
  // Returns original name for untranslated genres
}
```

### Chart Responsiveness
Different chart sizes for different contexts:
- Normal view: Large pie charts (outerRadius: 200)  
- Snapshot mode: Medium pie charts (outerRadius: 160) for better labels
- Container heights: 500px for time analysis, 600px for genre snapshots

### Recent Major Updates

- **Sorting Bug Fixes**: Fixed critical issues where items with fewer plays ranked higher than items with more plays
- **Data Snapshot Feature**: Replaced playlist import with screenshot generation for social sharing
- **Time Analysis Enhancement**: Pie chart enlarged with centered titles following genre analysis design
- **Genre Localization**: Added comprehensive Chinese translations for Western music genres
- **Visual Consistency**: Unified pure black theme with optimized chart sizing