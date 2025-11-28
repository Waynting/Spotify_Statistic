# Spotify App Review 準備清單

## ✅ 已完成項目

### 📱 應用程式基本設定
- [x] **應用程式名稱**: Spotify Crate
- [x] **描述**: 個人音樂聆聽分析工具，提供專輯櫃、智能時間分析和播放控制功能
- [x] **網站 URL**: 準備就緒 (需要部署到 Vercel)
- [x] **Redirect URIs**: `http://127.0.0.1:8000/callback` (開發), 生產環境需更新

### 📋 必需頁面和內容
- [x] **隱私政策頁面**: `/privacy` - 完整的隱私政策，符合 GDPR 要求
- [x] **使用條款頁面**: `/terms` - 詳細的使用條款和責任限制
- [x] **法律連結**: Settings 頁面中包含隱私政策和使用條款連結
- [x] **Spotify 授權管理連結**: 直接連結到 Spotify 帳戶設定

### 🔐 權限範圍 (Scopes)
需要申請以下權限，理由已準備：

- [x] **`user-top-read`** - 生成個人化專輯櫃和排行榜
- [x] **`user-read-recently-played`** - 時間段分析和聆聽趨勢
- [x] **`user-read-playback-state`** - 顯示播放狀態和裝置列表
- [x] **`user-modify-playbook-state`** - Spotify Connect 播放控制

### 🛡️ 合規要求
- [x] **最小必要權限**: 只申請實際使用的 scopes
- [x] **本地資料處理**: 所有資料在本地處理，不上傳伺服器
- [x] **清楚的 UI 提示**: 登入前說明功能和資料使用
- [x] **資料刪除**: 設定頁面有撤銷授權說明
- [x] **品牌合規**: 不暗示官方合作，聲明獨立第三方應用

## ⚠️ 重要限制：用戶白名單

**非企業帳號限制**：
- 免費/個人 Spotify Developer 帳號最多只能添加 **25 個用戶** 到白名單
- 只有白名單中的用戶可以完成 OAuth 授權
- 公開應用需要申請 Spotify 企業帳號或 Extended Quota

**解決方案**：
- 個人使用：25 個用戶通常足夠
- 公開應用：申請企業帳號或 Extended Quota
- 詳細說明請參考 [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md#-重要限制用戶白名單)

## 📝 審核表單填寫內容

### 應用程式描述 (英文)
```
Spotify Crate is a personal music analytics dashboard that visualizes a user's most-listened albums and artists as a visual 'shelf', provides intelligent time-based listening analytics across multiple time windows (7/30/180/365 days), and enables playback control via Spotify Connect. Features include album cover displays, sun-themed time segment analysis, and comprehensive music preference visualization.
```

### 權限申請理由

**user-top-read**:
"To generate and display the personalized album shelf, artist rankings, and top tracks analysis across different time periods."

**user-read-recently-played**:
"To populate recent listening events for time-window analytics and intelligent time segment analysis with realistic listening patterns."

**user-read-playback-state**:
"To display current playback status and list available Spotify Connect devices for playback control."

**user-modify-playback-state**:
"To enable one-click album/track playback and transfer playback to selected devices via Spotify Connect."

### 資料處理說明
```
Web version: Access tokens and analysis cache stored in browser localStorage only. 
Desktop version: Local SQLite storage. 
No server-side personal data storage. 
Users can clear all data via Settings and revoke access in Spotify account settings.
```

### 資料刪除說明
```
Users can revoke access anytime in Spotify account settings (https://www.spotify.com/account/apps/). 
Local data can be cleared via in-app Settings page. 
Detailed instructions provided in our Privacy Policy at /privacy.
```

## 📸 需要準備的素材

### 螢幕截圖
需要準備以下截圖：
- [ ] 登入頁面 (顯示授權說明)
- [ ] 專輯櫃頁面 (顯示專輯封面網格)
- [ ] 分析儀表板 (顯示各種圖表)
- [ ] 時間段分析 (展示陽光主題配色)
- [ ] 設定頁面 (顯示資料管理選項)

### 示範影片 (可選但加分)
- [ ] 30-90 秒影片展示：登入 → 專輯櫃 → 分析 → 播放控制
- [ ] 重點展示智能時間分析和專輯封面功能

## 🚀 部署前檢查

### 生產環境設定
- [ ] 部署到 Vercel 或其他平台
- [ ] 更新 Spotify Dashboard 的 Redirect URIs 為生產 URL
- [ ] 確認 `/privacy` 和 `/terms` 頁面可公開存取
- [ ] 測試完整的 OAuth 流程
- [ ] 確認所有功能在生產環境正常運作

### 最終檢查
- [ ] 首次登入體驗包含功能說明
- [ ] 隱私政策連結在多處可見
- [ ] 撤銷授權說明清楚易懂
- [ ] 不包含任何 Spotify 品牌誤用
- [ ] 移除所有 demo 資料，確保需要真實授權

## 📋 提交流程

1. **準備素材**: 完成上述所有檢查項目
2. **前往 Spotify Developer Dashboard**
3. **選擇 App Review** 
4. **填寫所有必需資訊**
5. **上傳截圖和影片**
6. **提交審核**
7. **等待結果** (通常數天到數週)

## 🔄 常見退件修正

如果被退件，常見原因和修正方式：
- **權限過多**: 移除不需要的 scopes
- **隱私政策問題**: 確保政策完整且可存取
- **網站無法存取**: 確認生產 URL 和 callback 正常
- **品牌問題**: 移除不當 Spotify Logo 使用
- **資料刪除不清楚**: 加強刪除和撤銷說明

---

**準備完成後，此應用程式將可供所有 Spotify 用戶使用！**