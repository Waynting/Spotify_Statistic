import React from 'react'
import { Shield, Database, Trash2, Mail, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            返回首頁
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-300 mb-2">
              <strong>Spotify Crate</strong> - 個人音樂聆聽分析工具
            </p>
            <p className="text-gray-400 text-sm">
              最後更新：2025年9月16日
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Data We Access */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold">1. Data We Access</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p>我們僅透過 Spotify OAuth 存取您授權的資料：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>基本檔案資訊</strong>：Spotify 帳號的基本公開資訊</li>
                <li><strong>熱門項目</strong> (user-top-read)：用於生成個人化專輯櫃和排行榜</li>
                <li><strong>最近播放記錄</strong> (user-read-recently-played)：用於聆聽分析和時間段統計</li>
                <li><strong>播放狀態</strong> (user-read-playback-state)：顯示目前播放狀態和可用裝置</li>
                <li><strong>播放控制</strong> (user-modify-playback-state)：允許播放、暫停和切換裝置</li>
              </ul>
            </div>
          </section>

          {/* Purpose of Use */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">2. Purpose of Use</h2>
            <div className="space-y-3 text-gray-300">
              <p>我們使用您的資料來提供以下功能：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>顯示您的個人化「唱片櫃」，包含最愛專輯和藝人</li>
                <li>提供詳細的聆聽分析，包含不同時間範圍的統計</li>
                <li>透過 Spotify Connect 控制音樂播放</li>
                <li>展示音樂偏好和聆聽習慣的視覺化圖表</li>
              </ul>
            </div>
          </section>

          {/* Storage & Retention */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">3. Storage & Retention</h2>
            <div className="space-y-3 text-gray-300">
              <p><strong>Web 版本：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>存取 Token 儲存在瀏覽器的 localStorage 中</li>
                <li>分析結果可能暫時快取在本地端以提升效能</li>
                <li>我們不會將個人資料上傳到我們的伺服器</li>
              </ul>
              
              <p><strong>桌面版本：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>資料儲存在本地 SQLite 資料庫中</li>
                <li>所有資料保持在您的裝置上</li>
              </ul>
              
              <p className="text-yellow-400 font-medium">
                我們不會販售您的資料，也不會與第三方分享。
              </p>
            </div>
          </section>

          {/* Sharing */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">4. Sharing</h2>
            <div className="text-gray-300">
              <p>我們不會與任何第三方分享您的個人資料。您的音樂聆聽資料僅用於在應用程式內為您提供個人化體驗。</p>
            </div>
          </section>

          {/* Deletion & Revocation */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold">5. Deletion & Revocation</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p><strong>撤銷授權：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>您可以隨時在 <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Spotify 帳戶設定</a> 中撤銷存取權限</li>
                <li>撤銷後，應用程式將無法存取您的 Spotify 資料</li>
              </ul>
              
              <p><strong>清除本地資料：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>在應用程式的「設定」頁面中，您可以清除所有本地儲存的資料</li>
                <li>瀏覽器版本：清除瀏覽器儲存空間和快取</li>
                <li>桌面版本：刪除本地 SQLite 資料庫</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">6. Contact</h2>
            </div>
            <div className="text-gray-300">
              <p>如果您對此隱私政策有任何疑問或關切，請聯繫我們：</p>
              <p className="mt-2">
                <a href="mailto:support@spotify-crate.com" className="text-blue-400 hover:underline">
                  support@spotify-crate.com
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-gray-400 text-sm border-t border-gray-800 pt-6">
            <p>此隱私政策遵循一般資料保護規範 (GDPR) 和 Spotify Developer Terms of Service。</p>
            <p className="mt-2">Spotify Crate 不隶屬於 Spotify AB。</p>
          </div>
        </div>
      </div>
    </div>
  )
}