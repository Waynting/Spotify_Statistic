import React from 'react'
import { RefreshCw, Wifi, AlertTriangle, XCircle, Clock } from 'lucide-react'

interface ErrorDisplayProps {
  error: any
  onRetry: () => void
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const getErrorInfo = (error: any) => {
    if (error?.message?.includes('Failed to fetch')) {
      return {
        title: '網路連線問題',
        message: '無法連接到伺服器，請檢查網路連線並重試',
        icon: Wifi,
        color: 'text-red-400'
      }
    }
    
    if (error?.message?.includes('token') || error?.message?.includes('auth')) {
      return {
        title: '授權問題',
        message: '請重新登入 Spotify 帳號',
        icon: AlertTriangle,
        color: 'text-amber-400'
      }
    }
    
    if (error?.message?.includes('timeout')) {
      return {
        title: '請求超時',
        message: '伺服器回應時間過長，請重試',
        icon: Clock,
        color: 'text-orange-400'
      }
    }
    
    return {
      title: '載入失敗',
      message: '發生未知錯誤，請重試',
      icon: XCircle,
      color: 'text-red-400'
    }
  }

  const errorInfo = getErrorInfo(error)
  const Icon = errorInfo.icon

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Icon className={`w-16 h-16 ${errorInfo.color} mb-4`} />
          <h2 className="text-2xl font-bold text-white mb-2">{errorInfo.title}</h2>
          <p className="text-gray-400 mb-6 text-center max-w-md">{errorInfo.message}</p>
          <button
            onClick={onRetry}
            className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重試
          </button>
        </div>
      </div>
    </div>
  )
}