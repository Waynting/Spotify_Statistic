import React from 'react'
import { FileText, AlertTriangle, Scale, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TermsOfUse() {
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
            <FileText className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold">Terms of Use</h1>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-300 mb-2">
              <strong>Spotify Crate</strong> - 使用條款
            </p>
            <p className="text-gray-400 text-sm">
              最後更新：2025年9月16日
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Acceptance */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">1. 接受條款</h2>
            <div className="text-gray-300">
              <p>使用 Spotify Crate 即表示您同意遵守這些使用條款。如果您不同意這些條款，請不要使用本應用程式。</p>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">2. 服務描述</h2>
            <div className="space-y-3 text-gray-300">
              <p>Spotify Crate 是一個個人音樂聆聽分析工具，提供：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>個人化音樂專輯和藝人展示</li>
                <li>聆聽習慣和偏好的視覺化分析</li>
                <li>透過 Spotify Connect 的播放控制功能</li>
                <li>多種時間範圍的音樂統計數據</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold">3. 使用者責任</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p>使用本服務時，您同意：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>擁有有效的 Spotify 帳號和必要的訂閱</li>
                <li>不會濫用或破壞服務功能</li>
                <li>不會嘗試逆向工程或未經授權存取系統</li>
                <li>不會使用服務進行任何非法活動</li>
                <li>遵守 Spotify 的使用條款和社群準則</li>
              </ul>
            </div>
          </section>

          {/* Spotify Integration */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">4. Spotify 整合</h2>
            <div className="space-y-3 text-gray-300">
              <p>本應用程式與 Spotify 服務整合：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>您需要授權我們存取您的 Spotify 資料</li>
                <li>我們遵循 Spotify 的 Developer Terms of Service</li>
                <li>您可以隨時撤銷授權</li>
                <li>本應用程式不隸屬於 Spotify AB</li>
              </ul>
            </div>
          </section>

          {/* Data Usage */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">5. 資料使用</h2>
            <div className="text-gray-300">
              <p>我們僅使用您的 Spotify 資料來提供服務功能。詳細的資料處理方式請參考我們的 
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-blue-400 hover:underline mx-1"
                >
                  隱私政策
                </button>
                。
              </p>
            </div>
          </section>

          {/* Availability */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">6. 服務可用性</h2>
            <div className="text-gray-300">
              <p>我們努力提供穩定的服務，但不保證：</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>服務的持續可用性或不中斷</li>
                <li>所有功能在所有情況下都能正常運作</li>
                <li>與所有 Spotify 帳號類型的完全相容性</li>
              </ul>
            </div>
          </section>

          {/* Liability */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold">7. 責任限制</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p>本服務按「現狀」提供。在法律允許的最大範圍內：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>我們不對任何直接、間接或附帶損失承擔責任</li>
                <li>我們不保證服務的準確性、完整性或及時性</li>
                <li>您自行承擔使用本服務的風險</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">8. 終止</h2>
            <div className="text-gray-300">
              <p>您或我們都可以隨時終止服務的使用：</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>您可以隨時停止使用並撤銷 Spotify 授權</li>
                <li>我們保留在合理通知下暫停或終止服務的權利</li>
                <li>終止後，這些條款的相關部分仍然有效</li>
              </ul>
            </div>
          </section>

          {/* Changes */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">9. 條款變更</h2>
            <div className="text-gray-300">
              <p>我們可能會不時更新這些使用條款。重大變更將在應用程式中通知使用者。繼續使用服務即表示接受更新後的條款。</p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">10. 聯繫我們</h2>
            <div className="text-gray-300">
              <p>如對這些條款有疑問，請聯繫：</p>
              <p className="mt-2">
                <a href="mailto:support@spotify-crate.com" className="text-blue-400 hover:underline">
                  support@spotify-crate.com
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-gray-400 text-sm border-t border-gray-800 pt-6">
            <p>這些條款受中華民國法律管轄。</p>
            <p className="mt-2">Spotify Crate 是獨立的第三方應用程式，不隸屬於 Spotify AB。</p>
          </div>
        </div>
      </div>
    </div>
  )
}