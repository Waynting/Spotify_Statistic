# 🎵 Spotify Crate - 開源音樂數據分析應用

一個完整的 Spotify 音樂聆聽分析工具，支援數據同步和歷史記錄追蹤。

## ✨ 功能特色

- **📊 音樂數據分析**：專輯、單曲、藝人、曲風、時段分析
- **📸 數據快照**：一鍵生成分享圖片
- **🎯 時間篩選**：7天/30天/90天/180天/365天 多維度分析
- **💾 歷史記錄**：自動同步播放記錄到資料庫
- **🌓 純黑設計**：OLED 友好的純黑背景
- **📱 響應式**：完美支援桌面和移動設備

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- PostgreSQL 資料庫（或使用 Supabase、Neon 等託管服務）
- Spotify Developer Account

### 安裝步驟

```bash
# 1. 複製專案
git clone https://github.com/Waynting/Spotify_Statistic.git
cd Spotify_Statistic

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 填入您的配置（見下方說明）

# 4. 執行資料庫遷移
npx tsx app/server/migrations/run-migrations.ts

# 5. 啟動開發環境
npm run dev
```

訪問 `http://localhost:3000` 開始使用！

## 🔑 Spotify 應用設定

詳細的 Spotify 應用設定步驟請參考 [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)

### 快速設定

1. 前往 [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. 創建新應用
3. 設定 Redirect URI：
   - 開發環境：`http://localhost:3000/callback`
   - 生產環境：`https://your-domain.com/callback`
4. 複製 Client ID 和 Client Secret
5. 在 `.env` 中設定環境變數

### ⚠️ 重要限制

**用戶白名單限制**：
- 非企業 Spotify 帳號最多只能添加 **25 個用戶** 到白名單
- 個人使用或小範圍測試通常足夠
- 公開應用需要申請 Spotify 企業帳號

詳細說明請參考 [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md#-重要限制用戶白名單)

## ⚙️ 環境變數設定

創建 `.env` 檔案並填入以下變數：

```env
# Spotify OAuth
SPOTIFY_CLIENT_ID=你的_client_id
SPOTIFY_CLIENT_SECRET=你的_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# 資料庫連接（PostgreSQL）
DATABASE_URL=postgresql://user:password@host:port/database

# Cron Job 密鑰（用於自動同步）
CRON_SECRET=隨機生成的密鑰字串
```

詳細說明請參考 `.env.example`

## 📦 部署

### Vercel 部署（推薦）

詳細部署步驟請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

#### 快速部署

1. Fork 本專案到您的 GitHub
2. 在 [Vercel](https://vercel.com) 導入專案
3. 設定環境變數（見上方）
4. 設定 PostgreSQL 資料庫（可使用 Vercel Postgres）
5. 部署！

### 其他平台

- **Netlify**: 需要設定 Next.js 運行時
- **Railway**: 支援 PostgreSQL 和 Next.js
- **自託管**: 需要 Node.js 環境和 PostgreSQL

## 🏗️ 技術架構

### 技術棧

```
Frontend:
├── Next.js 14 (App Router)
├── React 18 + TypeScript
├── Tailwind CSS
├── TanStack Query (數據管理)
├── Zustand (狀態管理)
└── Recharts (圖表)

Backend:
├── Next.js API Routes
├── PostgreSQL
└── Spotify Web API

認證:
└── Spotify OAuth 2.0 with PKCE
```

### 專案結構

```
app/
├── components/          # React 組件
│   ├── analytics/      # 分析組件
│   └── ...
├── api/                # Next.js API Routes
│   ├── auth/           # 認證相關
│   ├── sync/           # 數據同步
│   └── analytics/      # 數據分析
├── server/              # 後端服務
│   ├── models/         # 資料庫模型
│   ├── services/       # 業務邏輯
│   └── migrations/     # 資料庫遷移
└── lib/                # 工具庫
```

## 🛠️ 開發指南

### 本地開發

```bash
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 執行資料庫遷移
npx tsx app/server/migrations/run-migrations.ts

# 驗證資料庫表結構
npx tsx app/server/migrations/verify-tables.ts

# 測試同步功能
npx tsx app/server/migrations/test-sync.ts
```

### 資料庫管理

```bash
# 執行遷移
npx tsx app/server/migrations/run-migrations.ts

# 驗證表結構
npx tsx app/server/migrations/verify-tables.ts
```

## 📚 文檔

- [部署指南](./DEPLOYMENT.md) - 詳細的部署說明
- [Spotify 設定](./SPOTIFY_SETUP.md) - Spotify 應用設定步驟
- [專案結構](./PROJECT_STRUCTURE.md) - 代碼結構說明

## 🔄 數據同步

系統會自動同步用戶的播放記錄：

1. **用戶登入時**：自動觸發首次同步
2. **Cron Job**：每天 UTC 00:00 自動同步所有用戶
3. **手動同步**：用戶可在設定頁面手動觸發

## ❓ 常見問題

### 為什麼需要資料庫？

資料庫用於儲存歷史播放記錄，讓您可以：
- 查看更長時間範圍的數據
- 追蹤播放趨勢
- 提供更準確的分析

### 資料安全嗎？

- 所有數據儲存在您的資料庫中
- OAuth token 加密儲存
- 支援用戶隨時撤銷授權

### Spotify API 用戶限制

**重要**：Spotify API 對非企業用戶有白名單限制：
- **免費/個人帳號**：最多只能添加 **25 個用戶** 到白名單
- **企業帳號**：無限制

這意味著：
- 如果您的應用面向公眾，需要申請 Spotify 企業帳號
- 個人使用或小範圍測試，25 個用戶限制通常足夠
- 超過 25 個用戶後，新用戶將無法完成 OAuth 授權

**解決方案**：
1. 申請 Spotify 企業帳號（需要商業驗證）
2. 限制應用使用範圍在 25 人以內
3. 使用 Spotify 的 Extended Quota 計劃（需要申請）

### 可以商用嗎？

本專案採用 MIT 授權，可自由使用。但需遵守 Spotify API 使用條款。**注意**：商業使用需要 Spotify 企業帳號以支援更多用戶。

## 📄 授權

MIT License - 可自由使用、修改和分發

## 🤝 貢獻

歡迎 PR！請確保：
- 通過 TypeScript 檢查
- 遵循現有代碼風格
- 更新相關文檔

---

**Built with ❤️ using Next.js + PostgreSQL + Spotify Web API**
