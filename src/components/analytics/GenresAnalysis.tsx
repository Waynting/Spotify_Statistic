import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Radio, TrendingUp, Zap, Star } from 'lucide-react'
import { AnalyticsGenreData } from '../../types/spotify'
import StatsCard from './StatsCard'

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316']

// 曲風中文翻譯對照表
const genreTranslations: { [key: string]: string } = {
  'pop': '流行',
  'rock': '搖滾',
  'hip hop': '嘻哈',
  'hip-hop': '嘻哈',
  'rap': '饒舌',
  'jazz': '爵士',
  'blues': '藍調',
  'country': '鄉村',
  'electronic': '電子',
  'dance': '舞曲',
  'folk': '民謠',
  'classical': '古典',
  'indie': '獨立',
  'alternative': '另類',
  'r&b': '節奏藍調',
  'soul': '靈魂樂',
  'funk': '放克',
  'punk': '龐克',
  'metal': '金屬',
  'reggae': '雷鬼',
  'house': '浩室',
  'techno': '鐵克諾',
  'dubstep': '迴響貝斯',
  'ambient': '氛圍音樂',
  'trap': '陷阱音樂',
  'drill': '鑽石說唱',
  'phonk': '放克嘻哈',
  'emo': '情緒搖滾',
  'grunge': '垃圾搖滾',
  'new wave': '新浪潮',
  'synth-pop': '合成器流行',
  'disco': '迪斯可',
  'latin': '拉丁',
  'reggaeton': '雷鬼舞',
  'k-pop': 'K-Pop',
  'j-pop': 'J-Pop',
  'c-pop': 'C-Pop',
  'mandopop': '華語流行',
  'cantopop': '粵語流行'
}

// 獲取曲風的中文標籤
function getGenreLabel(genreName: string): string {
  const lowerName = genreName.toLowerCase()
  
  // 尋找完全匹配
  if (genreTranslations[lowerName]) {
    return `${genreTranslations[lowerName]} (${genreName})`
  }
  
  // 尋找部分匹配
  for (const [english, chinese] of Object.entries(genreTranslations)) {
    if (lowerName.includes(english)) {
      return `${chinese} (${genreName})`
    }
  }
  
  // 沒有匹配則返回原名
  return genreName
}

interface GenresAnalysisProps {
  data: AnalyticsGenreData[]
  isSnapshot?: boolean // 新增截圖模式標記
}

export default function GenresAnalysis({ data, isSnapshot = false }: GenresAnalysisProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-20">
        <Radio size={64} className="mx-auto mb-4 text-gray-500" />
        <h2 className="text-2xl font-semibold mb-2 text-white">沒有曲風數據</h2>
        <p className="text-gray-400">選擇的時間範圍內沒有找到曲風數據</p>
      </div>
    )
  }

  const topGenres = data.slice(0, 8)
  const totalCount = data.reduce((sum, genre) => sum + genre.count, 0)
  const mostPopularGenre = data[0]
  const diversityScore = Math.min(100, Math.round((data.length / 20) * 100))

  const pieData = topGenres.map(genre => ({
    name: getGenreLabel(genre.name),
    originalName: genre.name,
    value: genre.count,
    percentage: genre.percentage
  }))

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard
          icon={Radio}
          title="曲風總數"
          value={data.length.toString()}
          subtitle="不同曲風"
          color="text-gray-300"
        />
        <StatsCard
          icon={TrendingUp}
          title="最愛曲風"
          value={mostPopularGenre ? mostPopularGenre.name : '無'}
          subtitle={mostPopularGenre ? `${mostPopularGenre.percentage}%` : '無數據'}
          color="text-white"
        />
        <StatsCard
          icon={Zap}
          title="音樂多樣性"
          value={`${diversityScore}%`}
          subtitle="曲風豐富度"
          color="text-gray-400"
        />
      </div>

      {/* Pie Chart - Full Width */}
      <div className="bg-black border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">曲風分佈圓餅圖</h3>
        <div className={isSnapshot ? "h-[600px]" : "h-[500px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={isSnapshot ? 160 : 200}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value, name) => [`${value} 次`, '出現次數']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Genres List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">完整曲風清單</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.slice(0, 20).map((genre, index) => (
            <div key={genre.name} className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white text-sm font-medium truncate">{getGenreLabel(genre.name)}</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{genre.percentage}%</div>
                  <div className="text-gray-400 text-xs">{genre.count} 次</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {data.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">還有 {data.length - 20} 個曲風...</p>
          </div>
        )}
      </div>
    </div>
  )
}