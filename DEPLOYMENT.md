# 🚀 部署指南

本文檔說明如何構建和部署 Spotify Crate 應用程式。

## 📋 部署前檢查清單

### ✅ 環境準備
- [ ] Node.js 16+ 已安裝
- [ ] Rust 環境已配置（僅 Tauri 版本需要）
- [ ] 所有依賴已安裝 (`npm install`)
- [ ] 環境變數已設定

### ✅ Spotify App 設定
- [ ] 已在 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 創建應用
- [ ] 設定正確的 Redirect URI
- [ ] 複製 Client ID 到環境變數

## 🌐 Web 版本部署

### 1. 構建 Web 應用

```bash
# 安裝依賴
npm install

# 構建生產版本
npm run build

# 預覽構建結果
npm run preview
```

### 2. 環境設定

創建 `.env` 文件：

```env
VITE_SPOTIFY_CLIENT_ID=你的_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI_WEB=https://你的域名.com/callback
VITE_APP_NAME="Spotify Crate"
VITE_APP_VERSION="1.0.0"
```

### 3. 部署選項

#### Netlify
```bash
# 1. 構建
npm run build

# 2. 部署 dist/ 目錄
# Redirect 規則 (_redirects 文件):
/*    /index.html   200
```

#### Vercel

```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 部署
vercel --prod
```

**Vercel 環境變數設定：**
在 Vercel Dashboard 中設定以下環境變數：
- `VITE_SPOTIFY_CLIENT_ID`: 你的 Spotify Client ID
- `VITE_SPOTIFY_REDIRECT_URI_PROD`: https://你的域名.vercel.app/callback

**Vercel 配置文件 (vercel.json)：**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### GitHub Pages
```bash
# 1. 設定 base path (vite.config.ts)
base: '/repository-name/'

# 2. 構建並推送到 gh-pages 分支
npm run build
npm run deploy
```

## 💻 桌面應用部署

### 1. 開發環境測試

```bash
# 運行開發版本
npm run tauri dev
```

### 2. 生產構建

```bash
# 構建所有目標平台
npm run tauri build

# 構建特定平台
npm run tauri build -- --target x86_64-apple-darwin     # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin    # macOS Apple Silicon  
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows x64
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux x64
```

### 3. 構建輸出

構建完成後，可執行文件位於：

```
src-tauri/target/release/bundle/
├── macos/           # macOS .app 和 .dmg
├── msi/             # Windows .msi 安裝檔
├── deb/             # Linux .deb 套件
└── appimage/        # Linux AppImage
```

## 🔧 進階配置

### Tauri 應用配置

編輯 `src-tauri/tauri.conf.json`：

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Spotify Crate",
    "version": "1.0.0"
  },
  "app": {
    "windows": [
      {
        "title": "Spotify Crate",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### 自動更新設定

1. 配置更新伺服器
2. 設定 `tauri.conf.json` 中的 updater
3. 簽署應用程式（生產環境必需）

## 🔐 安全考量

### 生產環境檢查
- [ ] 移除開發用的 debug 訊息
- [ ] 確認 API 金鑰安全性
- [ ] 設定正確的 Content Security Policy
- [ ] 驗證 HTTPS 設定

### Spotify API 配額
- **開發模式**：最多 25 個測試用戶
- **擴展配額**：最多 25,000 個用戶
- **完整審核**：無限制用戶

## 📊 監控和分析

### 錯誤追蹤
建議集成錯誤追蹤服務：
- Sentry
- Bugsnag
- LogRocket

### 使用分析
可選擇集成：
- Google Analytics
- Mixpanel
- Amplitude

## 🔄 持續部署

### GitHub Actions 範例

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}

  build-desktop:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: npm install
      - run: npm run tauri build
```

## 🐛 常見問題

### 構建失敗
1. **Node.js 版本問題**：確保使用 Node.js 16+
2. **Rust 環境問題**：重新安裝 Rust toolchain
3. **依賴衝突**：清除 `node_modules` 和 `package-lock.json` 重新安裝

### 運行時問題
1. **Spotify 認證失敗**：檢查 Client ID 和 Redirect URI
2. **API 配額超限**：考慮申請擴展配額
3. **CORS 錯誤**：確認域名設定正確

### 性能優化
1. **Bundle 大小**：使用 `npm run analyze` 分析
2. **圖片優化**：壓縮專輯封面圖片
3. **緩存策略**：調整 React Query 設定

## 📞 支援

部署過程中遇到問題？
- 檢查 [GitHub Issues](../../issues)
- 參考 [Tauri 官方文檔](https://tauri.app/)
- 查看 [Spotify API 文檔](https://developer.spotify.com/documentation/)

---

🎉 **部署成功後，記得測試所有核心功能！**