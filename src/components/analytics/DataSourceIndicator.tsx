import React from 'react'
import { Wifi, AlertTriangle, Zap, WifiOff } from 'lucide-react'
import { DataSourceInfo } from '../../types/spotify'

interface DataSourceIndicatorProps {
  sourceInfo?: DataSourceInfo
}

export default function DataSourceIndicator({ sourceInfo }: DataSourceIndicatorProps) {
  if (!sourceInfo) return null
  
  const getSourceIcon = () => {
    switch (sourceInfo.source) {
      case 'spotify':
        return <Wifi size={14} className="text-green-400" />
      case 'demo':
        return <AlertTriangle size={14} className="text-amber-400" />
      case 'cache':
        return <Zap size={14} className="text-blue-400" />
      default:
        return <WifiOff size={14} className="text-gray-400" />
    }
  }

  const getSourceText = () => {
    switch (sourceInfo.source) {
      case 'spotify':
        return '即時資料'
      case 'demo':
        return '範例資料'
      case 'cache':
        return '快取資料'
      default:
        return '未知來源'
    }
  }

  const getSourceColor = () => {
    switch (sourceInfo.source) {
      case 'spotify':
        return 'bg-green-500/10 border-green-500/20 text-green-300'
      case 'demo':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      case 'cache':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-300'
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border ${getSourceColor()}`}>
      {getSourceIcon()}
      <span className="font-medium">{getSourceText()}</span>
      {sourceInfo.source === 'demo' && (
        <span className="opacity-75">• 連接 Spotify 查看個人數據</span>
      )}
    </div>
  )
}