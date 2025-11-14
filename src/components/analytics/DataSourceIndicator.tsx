import React from 'react'
import { Wifi, AlertTriangle, Zap, WifiOff, Info } from 'lucide-react'
import { DataSourceInfo } from '../../types/spotify'

interface DataSourceIndicatorProps {
  sourceInfo?: DataSourceInfo
}

export default function DataSourceIndicator({ sourceInfo }: DataSourceIndicatorProps) {
  if (!sourceInfo) return null

  const getSourceIcon = () => {
    switch (sourceInfo.source) {
      case 'spotify':
        return <Wifi size={14} className="text-white" />
      case 'demo':
        return <AlertTriangle size={14} className="text-gray-400" />
      case 'cache':
        return <Zap size={14} className="text-gray-300" />
      default:
        return <WifiOff size={14} className="text-gray-500" />
    }
  }

  const getSourceText = () => {
    switch (sourceInfo.source) {
      case 'spotify':
        return sourceInfo.isEstimated ? '估算資料' : '即時資料'
      case 'demo':
        return '範例資料'
      case 'cache':
        return sourceInfo.isEstimated ? '估算資料（快取）' : '快取資料'
      default:
        return '未知來源'
    }
  }

  const getSourceColor = () => {
    if (sourceInfo.isEstimated || sourceInfo.hasSimulatedData) {
      return 'bg-gray-800/50 border-gray-700 text-gray-300'
    }

    switch (sourceInfo.source) {
      case 'spotify':
        return 'bg-gray-800/50 border-gray-700 text-white'
      case 'demo':
        return 'bg-gray-800/50 border-gray-700 text-gray-400'
      case 'cache':
        return 'bg-gray-800/50 border-gray-700 text-gray-300'
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-500'
    }
  }

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border ${getSourceColor()}`}>
        {getSourceIcon()}
        <span className="font-medium">{getSourceText()}</span>
        {sourceInfo.source === 'demo' && (
          <span className="opacity-75">• 連接 Spotify 查看個人數據</span>
        )}
        {sourceInfo.actualDataPoints && (
          <span className="opacity-75">• {sourceInfo.actualDataPoints} 個數據點</span>
        )}
      </div>

      {/* Display API limitations and warnings */}
      {(sourceInfo.apiLimitations && sourceInfo.apiLimitations.length > 0) && (
        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            {sourceInfo.apiLimitations.map((limitation, index) => (
              <div key={index} className="leading-relaxed">{limitation}</div>
            ))}
          </div>
        </div>
      )}

      {/* Simulated data warning */}
      {sourceInfo.hasSimulatedData && (
        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <div>部分數據為模擬生成，僅供參考</div>
        </div>
      )}
    </div>
  )
}