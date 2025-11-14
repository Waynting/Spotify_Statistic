import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Camera, Download, CheckSquare, Clock, BarChart, Music, Mic, PieChart, Calendar, Circle, CheckCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import { dataService } from '../lib/data-service'
import { ANALYTICS_TIME_WINDOWS } from '../constants/timeWindows'

// Import analysis components
import AlbumsAnalysis from './analytics/AlbumsAnalysis'
import TracksAnalysis from './analytics/TracksAnalysis'
import ArtistsAnalysis from './analytics/ArtistsAnalysis'
import GenresAnalysis from './analytics/GenresAnalysis'
import TimeSegmentAnalysis from './analytics/TimeSegmentAnalysis'

interface DataSection {
  id: string
  label: string
  icon: React.ElementType
  description: string
}

const DATA_SECTIONS: DataSection[] = [
  { id: 'albums', label: '專輯分析', icon: BarChart, description: '熱門專輯和播放統計' },
  { id: 'tracks', label: '歌曲分析', icon: Music, description: '熱門歌曲和聆聽時間' },
  { id: 'artists', label: '藝人分析', icon: Mic, description: '最愛藝人和流派' },
  { id: 'genres', label: '曲風分析', icon: PieChart, description: '音樂風格分佈' },
  { id: 'timeSegments', label: '時間分析', icon: Calendar, description: '不同時段的聆聽習慣' },
]

export default function DataSnapshot() {
  const [selectedSection, setSelectedSection] = useState<string>('albums')
  const [selectedWindow, setSelectedWindow] = useState('30d')
  const [isGenerating, setIsGenerating] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Get analytics data for selected section only
  const analyticsQuery = useQuery({
    queryKey: ['analytics', selectedWindow, selectedSection],
    queryFn: async () => {
      if (selectedSection === 'timeSegments') {
        return dataService.getTimeSegmentAnalysis(selectedWindow) as any
      }
      return dataService.getAnalyticsData(selectedWindow, selectedSection) as any
    },
    enabled: true
  })

  const selectSection = (sectionId: string) => {
    setSelectedSection(sectionId)
  }

  const generateSnapshot = async () => {
    if (!previewRef.current || !selectedSection) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#000000',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `spotify-analytics-${selectedWindow}-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Screenshot generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderAnalysisSection = () => {
    if (!analyticsQuery.data?.data) return null
    
    switch (selectedSection) {
      case 'albums':
        return (
          <div className="mb-8">
            <AlbumsAnalysis data={analyticsQuery.data.data as any} selectedWindow={selectedWindow} />
          </div>
        )
      case 'tracks':
        return (
          <div className="mb-8">
            <TracksAnalysis data={analyticsQuery.data.data as any} selectedWindow={selectedWindow} />
          </div>
        )
      case 'artists':
        return (
          <div className="mb-8">
            <ArtistsAnalysis data={analyticsQuery.data.data as any} selectedWindow={selectedWindow} />
          </div>
        )
      case 'genres':
        return (
          <div className="mb-8">
            <GenresAnalysis data={analyticsQuery.data.data as any} isSnapshot={true} />
          </div>
        )
      case 'timeSegments':
        return (
          <div className="mb-8">
            <TimeSegmentAnalysis data={analyticsQuery.data.data as any} selectedWindow={selectedWindow} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Camera className="text-white" size={32} />
            <h1 className="text-3xl lg:text-4xl font-bold text-white">數據快照</h1>
          </div>
          <p className="text-gray-400">選擇分析區段並生成個人化音樂統計截圖</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Section Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckSquare size={20} />
                分析區段
              </h2>
              
              <div className="space-y-3">
                {DATA_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isSelected = selectedSection === section.id
                  
                  return (
                    <div
                      key={section.id}
                      onClick={() => selectSection(section.id)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'bg-white/10 border-white/40 text-white' 
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {isSelected ? (
                            <CheckCircle size={16} className="text-white" />
                          ) : (
                            <Circle size={16} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={16} />
                            <span className="font-medium text-sm">{section.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{section.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time Window Selection */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  時間範圍
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {ANALYTICS_TIME_WINDOWS.map((window) => (
                    <button
                      key={window.value}
                      onClick={() => setSelectedWindow(window.value)}
                      className={`
                        p-2 rounded-lg text-xs font-medium transition-all duration-200
                        ${selectedWindow === window.value
                          ? 'bg-white text-black'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      {window.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateSnapshot}
                disabled={!selectedSection || isGenerating}
                className={`
                  w-full mt-6 p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                  ${!selectedSection || isGenerating
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-200 text-black shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    下載截圖
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">預覽</h2>
                <div className="text-sm text-gray-400">
                  已選擇：{DATA_SECTIONS.find(s => s.id === selectedSection)?.label || '無'}
                </div>
              </div>

              {!selectedSection ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Camera size={64} className="text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">選擇分析區段</h3>
                  <p className="text-gray-400">
                    從左側選擇一個數據分析區段進行截圖
                  </p>
                </div>
              ) : (
                <div
                  ref={previewRef}
                  className="bg-black p-6 rounded-lg min-h-[400px]"
                  style={{ 
                    maxWidth: '100%',
                    // 為曲風分析調整寬度和高度，現在有更大空間顯示圓餅圖
                    width: selectedSection === 'genres' ? '800px' : 'auto',
                    minHeight: selectedSection === 'genres' ? '700px' : '400px'
                  }}
                >
                  <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                      我的 Spotify 音樂分析
                    </h1>
                    <p className="text-gray-400 mb-1">
                      {ANALYTICS_TIME_WINDOWS.find(w => w.value === selectedWindow)?.description}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {DATA_SECTIONS.find(s => s.id === selectedSection)?.label}
                    </p>
                  </div>
                  
                  {renderAnalysisSection()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}