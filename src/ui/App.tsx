import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { ThemeProvider } from '../components/theme-provider'
import Layout from '../components/Layout'
import Albums from '../components/Albums'
import Analytics from '../components/Analytics'
import Crates from '../components/Crates'
import SpotifyCallback from '../components/SpotifyCallback'
import Settings from '../components/Settings'
import ErrorBoundary from '../components/ErrorBoundary'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Check if user is already authenticated
    // TODO: Check stored tokens
  }, [])

  // Always show the main app - authentication is optional
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/callback" element={<SpotifyCallback />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/albums" replace />} />
              <Route path="albums" element={<Albums />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="crates" element={<Crates />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  )
}