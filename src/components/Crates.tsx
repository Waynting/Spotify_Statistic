import React from 'react'
import { Folders, Music, Clock, Star } from 'lucide-react'

export default function Crates() {
  return (
    <div className="min-h-screen bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">收納夾</h1>
          <p className="text-gray-400">個人化音樂收藏管理</p>
        </div>

        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative">
              <Folders size={80} className="text-gray-600 mx-auto mb-4" />
              <div className="absolute top-0 right-0 bg-white text-black rounded-full p-1">
                <Star size={20} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white">功能開發中</h2>
            
            <p className="text-gray-400 leading-relaxed">
              收納夾功能即將推出！您將能夠創建自定義音樂收藏，
              整理您最愛的專輯和歌曲。
            </p>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">即將推出的功能</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Music className="text-gray-400 mt-1" size={16} />
                  <div>
                    <h4 className="text-white font-medium">自定義收藏</h4>
                    <p className="text-gray-400 text-sm">創建和管理個人音樂收藏夾</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Folders className="text-gray-400 mt-1" size={16} />
                  <div>
                    <h4 className="text-white font-medium">智能分類</h4>
                    <p className="text-gray-400 text-sm">根據心情、場景自動分類音樂</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-1" size={16} />
                  <div>
                    <h4 className="text-white font-medium">聆聽歷史</h4>
                    <p className="text-gray-400 text-sm">追蹤和管理您的音樂聆聽記錄</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500">
                💡 目前請使用「專輯分析」和「數據概覽」功能來探索您的音樂品味
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}