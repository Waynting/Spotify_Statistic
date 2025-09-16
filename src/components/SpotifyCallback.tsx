import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError(`認證失敗: ${errorParam}`)
        return
      }

      if (!code || !state) {
        setStatus('error')
        setError('缺少必要的認證參數')
        return
      }

      try {
        await handleCallback(code, state)
        setStatus('success')
        
        // Redirect to main app after a short delay
        setTimeout(() => {
          navigate('/albums')
        }, 2000)
        
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : '認證過程中發生錯誤')
      }
    }

    processCallback()
  }, [searchParams, navigate, handleCallback])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Spotify Crate</h1>
          
          {status === 'processing' && (
            <div>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green mb-4"></div>
              <p className="text-gray-400">正在處理 Spotify 認證...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white font-medium mb-2">認證成功！</p>
              <p className="text-gray-400">正在重定向到應用...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <p className="text-red-400 font-medium mb-2">認證失敗</p>
              <p className="text-gray-400 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="btn btn-primary"
                >
                  重試連接
                </button>
                <button
                  onClick={() => navigate('/albums')}
                  className="btn btn-secondary"
                >
                  返回應用
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}