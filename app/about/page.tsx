'use client'

import React from 'react'
import { Info, AlertCircle, Database, BarChart, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function About() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft size={20} />
            返回首頁
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-8 h-8 text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold">關於 Spotify Crate</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <BarChart size={24} />
              關於本應用
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Spotify Crate 是一個個人音樂聆聽分析工具，幫助你深入了解自己的音樂品味和聆聽習慣。
              透過連接你的 Spotify 帳號，我們可以分析你的聆聽數據，提供專輯、歌曲、藝人和曲風的統計分析。
            </p>
            <p className="text-gray-300 leading-relaxed">
              本應用使用 Spotify Web API 來獲取你的聆聽數據，並提供時間段分析、熱門歌曲排行等功能。
            </p>
          </section>

          {/* Data Limitations */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={24} className="text-yellow-400" />
              數據限制說明
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Spotify API 限制</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  Spotify Web API 對每次請求的數據量有限制：
                </p>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-2 ml-2">
                  <li>最近播放記錄（Recently Played）API 每次最多返回 50 個項目</li>
                  <li>熱門歌曲（Top Tracks）API 每次最多返回 50 個項目</li>
                  <li>熱門藝人（Top Artists）API 每次最多返回 50 個項目</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">播放次數估算</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  由於 API 限制，本應用無法獲取完整的歷史播放記錄。因此：
                </p>
                <ul className="list-disc list-inside text-gray-300 text-sm space-y-2 ml-2">
                  <li>播放次數是基於最近播放記錄和排名位置進行估算的</li>
                  <li>實際播放次數可能與顯示的數據有所不同</li>
                  <li>數據的準確性取決於可用的最近播放記錄數量</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">數據完整性</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  由於上述限制，實際數據可能因 API 限制而不完整。
                  本應用會盡可能使用可用的數據來提供準確的分析，但請理解某些統計數據可能只是估算值。
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <Database size={18} />
                  數據儲存與同步
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  為了提供更準確的歷史聆聽分析，我們會將你的播放記錄安全地儲存在資料庫中。
                  這些數據會定期同步更新，以提高分析的準確性和完整性。
                  你的數據受到加密保護，且你可以隨時要求刪除。
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">主要功能</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>專輯聆聽分析：查看你最常聽的專輯和聆聽時長</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>歌曲排行榜：分析你最喜歡的歌曲和播放次數</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>藝人分析：了解你最常聽的藝人和音樂風格</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>曲風分析：探索你的音樂品味和曲風分佈</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>時間段分析：了解你在不同時段的聆聽習慣</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white font-semibold">•</span>
                <span>數據快照：生成個人化的音樂統計截圖</span>
              </li>
            </ul>
          </section>

          {/* Privacy */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">隱私與安全</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              我們重視你的隱私。本應用只會存取必要的 Spotify 數據來提供分析功能。
              你的數據會被安全儲存，且不會與第三方分享。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/privacy')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm min-h-[44px]"
              >
                查看隱私政策
              </button>
              <button
                onClick={() => router.push('/terms')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm min-h-[44px]"
              >
                查看使用條款
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

