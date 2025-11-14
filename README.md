# 🎵 Spotify Crate - 開源音樂數據分析應用

一個無需後端的 Spotify 音樂聆聽分析工具。只需設定您自己的 Spotify Client ID，即可部署並使用完整功能。

## 🚀 給開發者：30 秒快速部署

```bash
# 1. 複製專案
git clone https://github.com/your-username/spotify-crate.git
cd spotify-crate

# 2. 安裝依賴
npm install

# 3. 設定環境變數（見下方詳細說明）
cp .env.example .env
# 編輯 .env 填入您的 Spotify Client ID

# 4. 啟動開發環境
npm run dev
```

**就這麼簡單！** 無需後端、無需資料庫、無需 Client Secret。

## 🔑 獲取 Spotify Client ID（必要步驟）

### 1. 創建 Spotify 應用
1. 前往 [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. 點擊「Create app」
3. 填寫應用資訊：
   - **App name**: 任意名稱（如：My Music Stats）
   - **App description**: 任意描述
   - **Website**: 您的網站或 `http://localhost:8000`
   - **Redirect URI**: 
     - 開發環境：`http://127.0.0.1:8000/callback`
     - 生產環境：`https://your-domain.com/callback`

### 2. 設定 API 權限
在應用設定中，確保勾選以下 API 權限：
- `user-top-read`
- `user-read-recently-played`
- `user-read-playback-state`
- `user-modify-playback-state`
- `user-read-currently-playing`

### 3. 複製 Client ID
在應用設定頁面複製您的 **Client ID**（不是 Client Secret！）

### 4. 設定環境變數
創建 `.env` 檔案：

```env
VITE_SPOTIFY_CLIENT_ID=你的_client_id_在這裡
VITE_SPOTIFY_REDIRECT_URI_WEB=http://127.0.0.1:8000/callback
VITE_SPOTIFY_REDIRECT_URI_DESKTOP=http://127.0.0.1:8001/callback
```

## 🏗️ 技術架構

### 核心特點
- **純前端架構**：使用 Spotify OAuth 2.0 PKCE 流程，無需後端
- **零資料庫**：所有數據來自 Spotify API，本地緩存優化效能
- **TypeScript + React**：現代化技術棧，類型安全
- **即時部署**：支援 Vercel、Netlify 等靜態網站託管

### 技術棧
```
Frontend:
├── React 18 + TypeScript
├── Vite (構建工具)
├── Tailwind CSS (樣式)
├── TanStack Query (數據管理)
├── Zustand (狀態管理)
├── Recharts (圖表)
└── Lucide React (圖標)

認證:
└── Spotify Web API (OAuth 2.0 with PKCE)
```

### 專案結構
```
src/
├── components/          # React 組件
│   ├── analytics/      # 分析組件（專輯、歌曲、藝人等）
│   ├── DataSnapshot.tsx # 數據快照功能
│   └── Settings.tsx    # OAuth 連接設定
├── lib/
│   ├── spotify-web-api.ts  # Spotify API 客戶端
│   ├── data-service.ts     # 數據處理層
│   └── config.ts          # 環境配置
└── types/              # TypeScript 類型定義
```

## 📦 部署到生產環境

### Vercel 部署（推薦）

1. Fork 本專案到您的 GitHub
2. 在 [Vercel](https://vercel.com) 導入專案
3. 設定環境變數：
   ```
   VITE_SPOTIFY_CLIENT_ID = 您的_client_id
   VITE_SPOTIFY_REDIRECT_URI_WEB = https://your-domain.vercel.app/callback
   ```
4. 部署！

### Netlify 部署

1. Fork 專案
2. 在 [Netlify](https://netlify.com) 導入
3. 建置設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 環境變數同上

### 自託管部署

```bash
# 建置生產版本
npm run build

# dist 目錄包含所有靜態檔案
# 上傳到任何靜態網站託管服務
```

## 🛠️ 開發指南

### 本地開發

```bash
# 開發模式（支援熱更新）
npm run dev

# TypeScript 類型檢查
npm run typecheck

# 建置檢查
npm run build

# 預覽生產版本
npm run preview
```

### 自訂修改

#### 更換品牌/主題
- 修改 `src/components/Layout.tsx` 的標題和導航
- 調整 `tailwind.config.js` 的顏色配置

#### 新增分析功能
1. 在 `src/components/analytics/` 新增組件
2. 在 `src/lib/data-service.ts` 新增數據處理
3. 在 `src/pages/Analytics.tsx` 引入新組件

#### 修改 OAuth 流程
- OAuth 實作在 `src/lib/spotify-web-api.ts`
- 回調處理在 `src/components/SpotifyCallback.tsx`

### API 使用說明

應用使用以下 Spotify Web API endpoints：
- `/me/top/{type}` - 獲取熱門內容
- `/me/player/recently-played` - 最近播放
- `/me/player` - 當前播放狀態

所有 API 調用都通過 `DataService` 類處理，包含：
- 自動 token 更新
- 錯誤處理
- 5 分鐘智能緩存

## 🎨 功能特色

- **📊 音樂數據分析**：專輯、單曲、藝人、曲風、時段分析
- **📸 數據快照**：一鍵生成分享圖片
- **🎯 時間篩選**：7天/30天/180天/365天 多維度分析
- **🌓 純黑設計**：OLED 友好的純黑背景
- **📱 響應式**：完美支援桌面和移動設備

## ❓ 常見問題

### 為什麼不需要 Client Secret？
本應用使用 OAuth 2.0 PKCE 流程，專為公開客戶端（如 SPA）設計，無需 Client Secret。

### 數據儲存在哪裡？
所有數據即時從 Spotify API 獲取，僅在瀏覽器內存中短暫緩存，不會永久儲存。

### 可以商用嗎？
本專案採用 MIT 授權，可自由使用。但需遵守 Spotify API 使用條款。

### 如何處理 API 限制？
應用內建智能緩存機制，相同請求 5 分鐘內不會重複調用。

## 📄 授權

MIT License - 可自由使用、修改和分發

## 🤝 貢獻

歡迎 PR！請確保：
- 通過 TypeScript 檢查
- 遵循現有代碼風格
- 更新相關文檔

---

**不需要後端，不需要資料庫，只需要您的創意！**

Built with ❤️ using React + Spotify Web API