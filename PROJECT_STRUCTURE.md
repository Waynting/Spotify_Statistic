# 📁 項目結構說明

本文檔詳細說明 Spotify Crate 項目的代碼組織結構。

## 🗂️ 根目錄結構

```
spotify-crate/
├── src/                    # 前端源代碼
├── src-tauri/             # Tauri 後端代碼
├── public/                # 靜態資源
├── dist/                  # 構建輸出目錄
├── node_modules/          # Node.js 依賴
├── package.json           # 項目配置和依賴
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 構建配置
├── tailwind.config.js    # Tailwind CSS 配置
├── README.md             # 項目說明
├── CLAUDE.md             # Claude 開發指南
└── .env                  # 環境變數配置
```

## 🎨 前端結構 (`src/`)

### 📱 核心組件 (`src/components/`)

```
components/
├── Analytics.tsx          # 🎯 主要數據分析頁面
├── Shelf.tsx             # 📚 專輯展示頁面
├── Settings.tsx          # ⚙️ 設置和診斷頁面
├── Crates.tsx            # 📦 收納夾頁面（即將推出）
├── Layout.tsx            # 🏗️ 主要布局組件
├── SpotifyCallback.tsx   # 🔗 OAuth 回調處理
├── SpotifyPlayer.tsx     # 🎵 音樂播放器組件
└── ...
```

**關鍵組件說明：**
- `Analytics.tsx` - 核心功能頁面，包含所有數據分析視圖
- `Layout.tsx` - 響應式布局，包含側邊欄和導航
- `Settings.tsx` - 認證管理和調試工具

### 🔧 工具庫 (`src/lib/`)

```
lib/
├── spotify-web-api.ts    # 🎵 Spotify API 客戶端
├── data-service.ts       # 📊 數據服務層
├── auth-manager.ts       # 🔐 認證管理器
├── auth-debug.ts         # 🐛 認證調試工具
├── config.ts             # ⚙️ 配置管理
├── cache-manager.ts      # 💾 緩存管理
└── api.ts               # 🌐 API 抽象層
```

**核心服務說明：**
- `spotify-web-api.ts` - 處理 Spotify OAuth 和 API 調用
- `data-service.ts` - 數據獲取、轉換和統計計算
- `auth-manager.ts` - 統一認證流程管理
- `auth-debug.ts` - 開發調試和問題診斷

### 🪝 自定義 Hooks (`src/hooks/`)

```
hooks/
├── useAuth.ts            # 🔐 認證狀態管理
├── useSpotifyPlayer.ts   # 🎵 播放器狀態管理
└── useTheme.ts          # 🎨 主題切換
```

### 🗃️ 狀態管理 (`src/store/`)

```
store/
├── useAuthStore.ts       # 🔐 全局認證狀態
├── usePlayerStore.ts     # 🎵 播放器狀態
└── themeStore.ts        # 🎨 主題設置
```

### 📝 類型定義 (`src/types/`)

```
types/
├── spotify.ts           # 🎵 Spotify API 類型
└── index.ts            # 📚 通用類型定義
```

**重要類型：**
- `AnalyticsTrackData` - 單曲分析數據
- `AnalyticsAlbumData` - 專輯分析數據
- `AnalyticsArtistData` - 藝人分析數據
- `DataSourceInfo` - 數據來源信息

## 🦀 後端結構 (`src-tauri/`)

### 🏗️ Rust 源代碼 (`src-tauri/src/`)

```
src/
├── main.rs              # 🚀 應用程式入口點
├── commands/            # 🎯 Tauri 命令處理器
│   ├── auth.rs         # 🔐 認證相關命令
│   ├── spotify.rs      # 🎵 Spotify API 命令
│   ├── db.rs          # 💾 數據庫操作命令
│   └── sync.rs        # 🔄 數據同步命令
├── db/                 # 💾 數據庫模組
│   ├── models.rs      # 📊 數據模型
│   ├── queries.rs     # 🔍 SQL 查詢
│   └── init.rs        # 🏗️ 數據庫初始化
├── auth/              # 🔐 認證模組
│   ├── oauth.rs       # 🔗 OAuth 流程
│   └── pkce.rs        # 🔒 PKCE 實現
└── spotify/           # 🎵 Spotify 集成
    ├── api.rs         # 🌐 API 客戶端
    └── models.rs      # 📊 數據模型
```

### 🗄️ 數據庫 (`src-tauri/migrations/`)

```
migrations/
└── 001_initial.sql      # 🏗️ 初始數據庫架構
```

**主要數據表：**
- `oauth_tokens` - Spotify 認證令牌
- `artist`, `album`, `track` - 音樂元數據緩存
- `play_event` - 用戶聆聽記錄
- `agg_snapshot` - 預計算的分析數據

## 🎯 數據流架構

### 📊 分析數據流程

```
用戶選擇時間窗口/分析類型
         ↓
Analytics.tsx (useQuery)
         ↓
data-service.ts (getAnalyticsData)
         ↓
spotify-web-api.ts (API 調用)
         ↓
數據轉換和統計計算
         ↓
緩存管理 (cache-manager.ts)
         ↓
UI 渲染和圖表顯示
```

### 🔐 認證流程

```
用戶點擊登入
         ↓
auth-manager.ts (startAuthFlow)
         ↓
spotify-web-api.ts (PKCE OAuth)
         ↓
SpotifyCallback.tsx (處理回調)
         ↓
useAuthStore (更新全局狀態)
         ↓
Layout.tsx (更新 UI 狀態)
```

## 🛠️ 開發指南

### 🔧 添加新功能

1. **新增分析類型**：
   - 在 `data-service.ts` 添加數據獲取方法
   - 在 `Analytics.tsx` 添加渲染函數
   - 在 `types/spotify.ts` 定義數據類型

2. **新增頁面組件**：
   - 在 `components/` 創建組件
   - 在 `App.tsx` 添加路由
   - 在 `Layout.tsx` 添加導航項目

3. **API 集成**：
   - 在 `spotify-web-api.ts` 添加 API 方法
   - 在 `types/spotify.ts` 定義回應類型
   - 考慮緩存策略

### 🐛 調試工具

- **前端調試**：瀏覽器開發者工具 + Console 日誌
- **認證調試**：Settings 頁面內建診斷工具
- **API 調試**：`auth-debug.ts` 提供詳細的 API 測試

### 📦 構建流程

```bash
# 開發模式
npm run dev          # 僅前端
npm run tauri dev    # 完整應用

# 生產構建
npm run build        # 前端構建
npm run tauri build  # 完整應用構建
```

## 📋 最佳實踐

### 🎨 UI/UX 指南

- **配色方案**：主要使用黑白配色，圖表保留彩色
- **響應式設計**：所有組件都應支援移動設備
- **載入狀態**：使用 skeleton 和 spinner 提供用戶反饋
- **錯誤處理**：提供清晰的錯誤信息和恢復選項

### 🔧 代碼規範

- **TypeScript**：所有代碼必須有完整的類型定義
- **組件結構**：使用函數組件和 hooks
- **狀態管理**：優先使用 React Query，全局狀態使用 Zustand
- **樣式**：使用 Tailwind CSS，避免內聯樣式

### 🚀 性能優化

- **數據緩存**：使用 React Query 和自定義緩存管理器
- **懶加載**：大型組件使用 React.lazy
- **圖片優化**：專輯封面使用適當尺寸
- **API 調用**：合併請求，避免過度調用

---

此文檔隨項目發展持續更新。如有疑問，請參考代碼註釋或 `CLAUDE.md` 文件。