// Get the appropriate redirect URI based on environment
// Security: Redirect URI must match exactly what's configured in Spotify Dashboard
const getRedirectUri = () => {
  if (import.meta.env.PROD) {
    // Production - use the actual deployed URL
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI_PROD || 'https://spotify-statistic-ntu.vercel.app/callback'
  } else {
    // Development - use local URL
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI_WEB || 'http://127.0.0.1:8000/callback'
  }
}

// Environment configuration
// Security: Client ID is public and safe to expose in frontend
// It's used for OAuth PKCE flow which doesn't require client secret
const getClientId = () => {
  // Priority: environment variable > localStorage (for fallback)
  // Note: Client ID stored in localStorage is for user convenience only
  // It's not a security risk as Client ID is meant to be public
  const envClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (envClientId) {
    return envClientId
  }
  
  // Fallback to localStorage (user may have configured it manually)
  const storedClientId = localStorage.getItem('spotify_client_id')
  if (storedClientId) {
    return storedClientId
  }
  
  return ''
}

const getDynamicScopes = () => {
  const defaultScopes = [
    'user-top-read',
    'user-read-recently-played', 
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ]
  
  const storedScopes = localStorage.getItem('spotify_scopes')
  return storedScopes ? storedScopes : defaultScopes.join(' ')
}

export const config = {
  spotify: {
    get clientId() { return getClientId() },
    redirectUri: getRedirectUri(),
    get scopes() { return getDynamicScopes() }
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Spotify Crate',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0'
  },
  isConfigured: () => {
    return !!getClientId()
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
}

// Helper function to parse Spotify auth URL and extract client_id and other params
export const parseSpotifyAuthUrl = (authUrl: string) => {
  try {
    const url = new URL(authUrl)
    
    // Validate this is a Spotify auth URL
    if (!url.hostname.includes('spotify.com') || !url.pathname.includes('authorize')) {
      throw new Error('這不是有效的 Spotify 授權 URL')
    }
    
    const clientId = url.searchParams.get('client_id')
    const scopes = url.searchParams.get('scope')
    const redirectUri = url.searchParams.get('redirect_uri')
    
    if (!clientId) {
      throw new Error('授權 URL 中找不到 client_id')
    }
    
    return {
      clientId,
      scopes: scopes || '',
      redirectUri: redirectUri || '',
      isValid: true
    }
  } catch (error) {
    return {
      clientId: '',
      scopes: '',
      redirectUri: '',
      isValid: false,
      error: error instanceof Error ? error.message : '無效的 URL'
    }
  }
}

// Function to save parsed auth config
export const saveSpotifyConfig = (clientId: string, scopes?: string) => {
  localStorage.setItem('spotify_client_id', clientId)
  if (scopes) {
    localStorage.setItem('spotify_scopes', scopes)
  }
}

export default config