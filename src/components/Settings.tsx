import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import config from '../lib/config'
import { LogOut, Music, ExternalLink, Wifi, AlertTriangle, Loader2, Bug, RefreshCw } from 'lucide-react'
import { authDebugger, AuthDebugInfo } from '../lib/auth-debug'

export default function Settings() {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    platform, 
    method,
    login, 
    logout 
  } = useAuth()
  
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [isDebugging, setIsDebugging] = useState(false)

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      // Error is already handled by the auth manager
      console.error('Login failed:', error)
    }
  }

  const handleLogout = () => {
    if (confirm('確定要登出嗎？')) {
      logout()
    }
  }

  const runDiagnostic = async () => {
    setIsDebugging(true)
    try {
      const info = await authDebugger.getDebugInfo()
      setDebugInfo(info)
      authDebugger.logDebugInfo(info)
    } catch (error) {
      console.error('診斷失敗:', error)
    } finally {
      setIsDebugging(false)
    }
  }

  const clearTokens = async () => {
    if (confirm('確定要清除所有認證資料嗎？這將登出並重置所有連接。')) {
      await authDebugger.clearAllTokens()
      logout()
      setDebugInfo(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">設定</h1>
      
      <div className="space-y-6">
        {/* Account Section */}
        <section className="bg-black border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Spotify 帳號</h2>
          
          {/* Account Connection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Spotify 帳號</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {isAuthenticated ? (
                    <>
                      <Wifi size={14} className="text-white" />
                      已連接 ({platform} 平台)
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="text-gray-500" />
                      未連接
                    </>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-gray-500 mt-1">
                    錯誤：{error}
                  </p>
                )}
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-700 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  登出
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Music size={16} />
                  )}
                  {isLoading ? '認證中...' : '連接 Spotify'}
                </button>
              )}
            </div>
            
            {!isAuthenticated && (
              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-white mb-2">
                    連接 Spotify 後可以：
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                    <li>查看你的真實聆聽記錄和專輯封面</li>
                    <li>分析不同時段的音樂偏好（智能時間分析）</li>
                    <li>取得個人化的統計數據和聆聽趨勢</li>
                    <li>透過 Spotify Connect 控制音樂播放</li>
                    <li>探索你的音樂習慣和曲風分佈</li>
                  </ul>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                  <p className="text-sm text-blue-200 mb-2">
                    <strong>資料安全承諾</strong>
                  </p>
                  <p className="text-sm text-blue-300/80">
                    我們僅存取您授權的 Spotify 資料，所有資料處理都在本地進行，不會上傳到我們的伺服器。您可以隨時撤銷授權。
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Legal & About Section */}
        <section className="bg-black border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">法律與關於</h2>
          <div className="space-y-4">
            {/* Legal Links */}
            <div className="flex flex-wrap gap-4">
              <a
                href="/privacy"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                隱私政策
              </a>
              <a
                href="/terms"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                使用條款
              </a>
              <a
                href="https://www.spotify.com/account/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                管理 Spotify 應用程式授權
              </a>
            </div>
            
            {/* App Info */}
            <div className="space-y-2 text-sm text-gray-400 pt-4 border-t border-gray-800">
              <p><strong className="text-white">Spotify Crate</strong> v{config.app.version}</p>
              <p>一個現代化的音樂聆聽分析工具，採用純黑色設計和陽光主題配色</p>
              <p>使用 React + TypeScript + Tailwind CSS + Recharts 開發</p>
              <p className="text-xs text-gray-500 mt-2">
                此應用程式不隸屬於 Spotify AB，僅使用 Spotify Web API 提供服務。
              </p>
            </div>
          </div>
        </section>

        {/* Debug Section */}
        <section className="bg-black border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Bug className="text-gray-400" size={20} />
            診斷工具
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={runDiagnostic}
                disabled={isDebugging}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isDebugging ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Bug size={16} />
                )}
                {isDebugging ? '診斷中...' : '執行診斷'}
              </button>
              
              <button
                onClick={clearTokens}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                清除認證資料
              </button>
            </div>

            {debugInfo && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-white">診斷結果</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-2">認證狀態</h4>
                    <div className="space-y-1 text-gray-400">
                      <div>已認證: {debugInfo.isAuthenticated ? '✓' : '✗'}</div>
                      <div>有 Access Token: {debugInfo.hasAccessToken ? '✓' : '✗'}</div>
                      <div>有 Refresh Token: {debugInfo.hasRefreshToken ? '✓' : '✗'}</div>
                      <div>Token 過期: {debugInfo.isTokenExpired ? '✗' : '✓'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-2">API 測試</h4>
                    <div className="space-y-1 text-gray-400">
                      <div>用戶資料: {debugInfo.apiTestResults.userProfile.success ? '✓' : '✗'}</div>
                      <div>熱門歌曲: {debugInfo.apiTestResults.topTracks.success ? '✓' : '✗'}</div>
                      <div>最近播放: {debugInfo.apiTestResults.recentlyPlayed.success ? '✓' : '✗'}</div>
                      <div>熱門藝人: {debugInfo.apiTestResults.topArtists.success ? '✓' : '✗'}</div>
                    </div>
                  </div>
                </div>

                {debugInfo.userProfile && (
                  <div>
                    <h4 className="font-medium text-white mb-2">用戶資料</h4>
                    <div className="text-sm text-gray-400">
                      <div>用戶名: {debugInfo.userProfile.display_name}</div>
                      <div>用戶 ID: {debugInfo.userProfile.id}</div>
                      <div>國家: {debugInfo.userProfile.country}</div>
                      <div>追蹤者: {debugInfo.userProfile.followers?.total || 0}</div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-white mb-2">設定資訊</h4>
                  <div className="text-xs text-gray-500 break-all">
                    <div>Client ID: {debugInfo.clientId || '未設定'}</div>
                    <div>權限範圍: {debugInfo.scopes}</div>
                    <div>重定向 URI: {debugInfo.redirectUri}</div>
                  </div>
                </div>

                {/* 顯示錯誤 */}
                {Object.entries(debugInfo.apiTestResults).some(([_, result]) => !result.success) && (
                  <div>
                    <h4 className="font-medium text-white mb-2">API 錯誤</h4>
                    <div className="text-xs text-gray-500 space-y-1">
                      {Object.entries(debugInfo.apiTestResults).map(([endpoint, result]) => 
                        !result.success && (
                          <div key={endpoint}>
                            {endpoint}: {result.error}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>


      </div>
    </div>
  )
}