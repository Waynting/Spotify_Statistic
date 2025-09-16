# 🎵 Spotify Crate

一個現代化的個人音樂聆聽分析工具，採用簡潔的黑白設計和豐富的數據可視化。

## ✨ 功能特色

### 🎵 核心分析功能
- 📊 **專輯分析**: 查看熱門專輯排行、播放次數和聆聽時長統計
- 📈 **單曲分析**: 深入了解最常播放的歌曲和播放模式
- 👨‍🎤 **藝人分析**: 探索您的音樂偶像、追蹤者數量和人氣指數
- 🎼 **曲風分析**: 了解您的音樂風格偏好分佈
- ⏰ **時間分析**: 分析不同時段的音樂聆聽習慣

### 🎨 設計特色
- **簡潔黑白配色**: 專業簡約的視覺設計，專注於內容
- **彩色數據圖表**: 保留圖表的豐富色彩，清晰呈現數據
- **響應式設計**: 完美支援桌面和移動設備
- **現代化介面**: 使用 Tailwind CSS 和 Lucide 圖標

### 🔐 技術特色
- **Spotify OAuth 2.0**: 安全的 PKCE 認證流程
- **本地數據處理**: 數據僅在本地處理，確保隱私安全
- **智能緩存**: 自動緩存機制，提升載入速度
- **範例模式**: 無需認證即可體驗功能

## 🚀 快速開始

### 開發環境

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run tauri dev
```

### 使用者設定

1. 啟動應用程式
2. 前往 **設定** 頁面
3. 按照指南建立你的 Spotify Developer 應用程式
4. 輸入 Client ID 並連接你的 Spotify 帳號

## 📦 分發選項

### 方案 1: 使用者自行設定 (推薦)

**優點:**
- 符合 Spotify API 使用條款
- 避免 API 配額限制
- 每位使用者擁有獨立的認證

**步驟:**
1. 分發編譯後的應用程式
2. 使用者首次啟動時會看到設定指南
3. 使用者建立自己的 Spotify Developer 應用程式
4. 輸入 Client ID 即可使用

### 方案 2: 預設 Client ID

如果你想為使用者提供即用的體驗，可以：

1. 更新 `src/lib/config.ts` 中的預設 Client ID
2. 在 Spotify Developer Dashboard 中設定多個 Redirect URI
3. 注意 API 配額限制 (每小時約 1000 次請求)

## 🛠️ 技術架構

### 前端技術棧
- **React 18** - 現代化前端框架
- **TypeScript** - 類型安全的開發體驗  
- **Vite** - 快速構建工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **TanStack Query** - 強大的數據獲取和緩存
- **Zustand** - 輕量級狀態管理
- **Recharts** - 響應式圖表庫

### 後端支持
- **Tauri 2.0** - 現代化桌面應用框架
- **Rust** - 高性能後端語言
- **SQLite** - 本地數據存儲
- **Spotify Web API** - 官方 API 集成

### 必要的 API 權限範圍
- `user-top-read` - 讀取用戶熱門內容
- `user-read-recently-played` - 讀取最近播放記錄  
- `user-read-playback-state` - 讀取播放狀態
- `user-modify-playback-state` - 控制播放
- `user-read-currently-playing` - 讀取當前播放

## 📋 環境設定

建立 `.env` 檔案：

```env
# Spotify API Configuration
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5174/callback

# Development
VITE_APP_NAME="Spotify Crate"
VITE_APP_VERSION="0.1.0"
```

## 🔧 建置與分發

```bash
# 開發建置
npm run tauri dev

# 生產建置
npm run tauri build

# 建置特定平台
npm run tauri build -- --target x86_64-apple-darwin  # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin # macOS Apple Silicon
npm run tauri build -- --target x86_64-pc-windows-msvc # Windows
```

## 📄 授權

本專案使用 MIT 授權條款。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

Built with ❤️ using Tauri + React