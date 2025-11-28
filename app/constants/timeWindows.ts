// 統一的時間窗口選項
export interface TimeWindow {
  value: string
  label: string
  description: string
}

// 基礎時間窗口（適用於大部分組件）
export const TIME_WINDOWS: TimeWindow[] = [
  { value: '7d', label: '一週', description: '過去七天' },
  { value: '30d', label: '一個月', description: '過去三十天' },
  { value: '90d', label: '三個月', description: '過去三個月' },
  { value: '180d', label: '半年', description: '過去六個月' },
  { value: '365d', label: '一年', description: '過去一年' },
]

// 分析頁面專用時間窗口（更簡潔的標籤）
export const ANALYTICS_TIME_WINDOWS: TimeWindow[] = [
  { value: '7d', label: '一週', description: '過去七天' },
  { value: '30d', label: '一個月', description: '過去三十天' },
  { value: '180d', label: '半年', description: '過去六個月' },
  { value: '365d', label: '一年', description: '過去一年' },
]

// 預設時間窗口
export const DEFAULT_TIME_WINDOW = '30d'