# 🚀 部署指南

本指南將幫助您將 Spotify Crate 部署到生產環境。

## 📋 前置需求

- GitHub 帳號
- Vercel 帳號（或其他部署平台）
- PostgreSQL 資料庫（Vercel Postgres、Supabase、Neon 等）
- Spotify Developer Account

## 🎯 部署步驟

### 1. 準備專案

```bash
# Fork 或 Clone 專案
git clone https://github.com/Waynting/Spotify_Statistic.git
cd Spotify_Statistic

# 安裝依賴
npm install
```

### 2. 設定 Spotify 應用

詳細步驟請參考 [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)

**重要**：記下您的：
- Client ID
- Client Secret
- Redirect URI（生產環境 URL）

**⚠️ 用戶限制**：
- 非企業 Spotify 帳號最多只能添加 **25 個用戶** 到白名單
- 如果應用面向公眾，需要申請 Spotify 企業帳號
- 個人使用或小範圍測試，25 個用戶限制通常足夠

### 3. 設定資料庫

#### 選項 A：使用 Vercel Postgres（推薦）

1. 在 Vercel 專案中點擊 "Storage"
2. 選擇 "Create Database" → "Postgres"
3. 創建資料庫後，Vercel 會自動設定 `POSTGRES_URL` 環境變數

#### 選項 B：使用 Supabase

1. 前往 [Supabase](https://supabase.com) 創建專案
2. 在專案設定中找到 "Connection string"
3. 複製連接字串（格式：`postgresql://...`）

#### 選項 C：使用 Neon

1. 前往 [Neon](https://neon.tech) 創建專案
2. 複製連接字串

#### 執行資料庫遷移

在本地執行遷移（或使用資料庫管理工具執行 SQL）：

```bash
# 設定本地環境變數
export DATABASE_URL="your_database_url"

# 執行遷移
npx tsx app/server/migrations/run-migrations.ts
```

或直接在資料庫中執行 `app/server/migrations/001_create_tables.sql`

### 4. 部署到 Vercel

#### 方法 A：透過 GitHub（推薦）

1. 將專案推送到 GitHub
2. 前往 [Vercel](https://vercel.com)
3. 點擊 "Add New Project"
4. 導入您的 GitHub 專案
5. 設定環境變數（見下方）
6. 點擊 "Deploy"

#### 方法 B：透過 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel

# 設定環境變數
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel env add DATABASE_URL
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
```

### 5. 設定環境變數

在 Vercel 專案設定中，添加以下環境變數：

```env
# Spotify OAuth
SPOTIFY_CLIENT_ID=你的_client_id
SPOTIFY_CLIENT_SECRET=你的_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://your-domain.vercel.app/callback

# 資料庫（如果使用 Vercel Postgres，會自動設定）
DATABASE_URL=postgresql://user:password@host:port/database

# Cron Job 密鑰（生成隨機字串）
CRON_SECRET=your_random_secret_string_here

# Node.js 環境
NODE_ENV=production
```

**生成 CRON_SECRET**：
```bash
# 使用 openssl
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. 設定 Cron Job

Vercel 會自動讀取 `vercel.json` 中的 Cron 設定：

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 0 * * *"
    }
  ]
}
```

這會在每天 UTC 00:00 執行數據同步。

**注意**：首次部署後，需要在 Vercel 專案設定中啟用 Cron Jobs。

### 7. 更新 Spotify Redirect URI

部署完成後，更新 Spotify Dashboard 中的 Redirect URI：

1. 前往 [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. 選擇您的應用
3. 編輯設定
4. 添加生產環境 Redirect URI：`https://your-domain.vercel.app/callback`
5. 儲存

### 8. 驗證部署

1. 訪問您的網站
2. 點擊「連接 Spotify」
3. 完成 OAuth 授權
4. 檢查資料庫是否有數據寫入

## 🔧 其他部署平台

### Railway

1. 連接 GitHub 專案
2. 設定環境變數
3. 添加 PostgreSQL 服務
4. 部署

### Netlify

**注意**：Netlify 需要額外設定才能支援 Next.js API Routes。

1. 使用 Netlify Next.js Runtime
2. 設定環境變數
3. 連接外部 PostgreSQL
4. 部署

### 自託管

```bash
# 建置
npm run build

# 啟動
npm start
```

需要：
- Node.js 18+
- PostgreSQL 資料庫
- 反向代理（Nginx）
- SSL 憑證（Let's Encrypt）

## 🔍 部署後檢查清單

- [ ] 環境變數已正確設定
- [ ] 資料庫遷移已執行
- [ ] Spotify Redirect URI 已更新
- [ ] Cron Job 已啟用
- [ ] 網站可以正常訪問
- [ ] OAuth 流程正常運作
- [ ] 數據可以正常同步
- [ ] 資料庫有數據寫入

## 🐛 常見問題

### Cron Job 沒有執行

- 檢查 Vercel 專案設定中的 Cron Jobs 是否啟用
- 確認 `CRON_SECRET` 環境變數已設定
- 查看 Vercel 日誌中的 Cron 執行記錄

### 資料庫連接失敗

- 確認 `DATABASE_URL` 格式正確
- 檢查資料庫是否允許外部連接
- 確認 IP 白名單設定（如適用）

### OAuth 回調失敗

- 確認 Redirect URI 與 Spotify Dashboard 設定一致
- 檢查 `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` 環境變數
- 確認使用 HTTPS（生產環境）

## 📞 需要幫助？

- 查看 [README.md](./README.md)
- 查看 [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)
- 提交 Issue 到 GitHub
