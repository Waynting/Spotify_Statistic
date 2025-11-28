'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function SpotifyCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { handleCallback } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  // Prevent double execution in React Strict Mode
  const isProcessingRef = useRef(false)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    const processCallback = async () => {
      // Skip if already processing or processed
      if (isProcessingRef.current || hasProcessedRef.current) {
        return
      }

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

      // Mark as processing
      isProcessingRef.current = true

      try {
        await handleCallback(code, state)
        hasProcessedRef.current = true
        setStatus('success')

        // Redirect to main app after a short delay
        setTimeout(() => {
          router.push('/analytics')
        }, 1500)

      } catch (err) {
        // Only show error if this is the first attempt
        if (!hasProcessedRef.current) {
          setStatus('error')
          setError(err instanceof Error ? err.message : '認證過程中發生錯誤')
        }
      } finally {
        isProcessingRef.current = false
      }
    }

    processCallback()
  }, [searchParams, router, handleCallback])

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
              <p className="text-gray-400 mb-2">正在重定向到應用...</p>
              <p className="text-gray-500 text-sm mt-2">資料正在背景同步中，請稍候...</p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <p className="text-red-400 font-medium mb-2">認證失敗</p>
              <p className="text-gray-400 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/settings')}
                  className="btn btn-primary"
                >
                  重試連接
                </button>
                <button
                  onClick={() => router.push('/analytics')}
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
