# 🎵 Spotify 應用設定指南

本指南將幫助您設定 Spotify Developer 應用，以便使用 Spotify Crate。

## 📋 前置需求

- Spotify 帳號（免費即可）
- 訪問 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## 🚀 設定步驟

### 1. 創建 Spotify 應用

1. 前往 [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. 使用您的 Spotify 帳號登入
3. 點擊右上角的「Create app」按鈕
4. 填寫應用資訊：
   - **App name**: `Spotify Crate`（或您喜歡的名稱）
   - **App description**: `個人音樂聆聽分析工具`
   - **Website**: 
     - 開發環境：`http://localhost:3000`
     - 生產環境：`https://your-domain.com`
   - **Redirect URI**: 
     - 開發環境：`http://localhost:3000/callback`
     - 生產環境：`https://your-domain.com/callback`
   - **Which API/SDKs are you planning to use?**: 選擇「Web API」
5. 勾選「I understand and agree to Spotify's Developer Terms of Service」
6. 點擊「Save」

### 2. 設定 Redirect URIs

**重要**：您需要為開發和生產環境分別設定 Redirect URI。

1. 在應用設定頁面，找到「Redirect URIs」區塊
2. 點擊「Edit」
3. 添加以下 URI：
   ```
   http://localhost:3000/callback
   https://your-domain.com/callback
   ```
4. 點擊「Add」添加每個 URI
5. 點擊「Save」

### 3. 複製憑證

1. 在應用設定頁面，找到「Client ID」
2. 點擊「Show client secret」顯示 Client Secret
3. 複製以下資訊：
   - **Client ID**: 用於 `SPOTIFY_CLIENT_ID`
   - **Client Secret**: 用於 `SPOTIFY_CLIENT_SECRET`

**安全提示**：
- 不要將 Client Secret 提交到公開的 Git 倉庫
- 使用環境變數儲存敏感資訊
- 如果 Client Secret 洩露，請立即重新生成

### 4. 設定 API 權限（Scopes）

Spotify Crate 需要以下 API 權限：

1. 在應用設定頁面，找到「User Authorization Scopes」
2. 勾選以下權限：
   - ✅ `user-top-read` - 讀取用戶的熱門內容
   - ✅ `user-read-recently-played` - 讀取最近播放記錄
   - ✅ `user-read-playback-state` - 讀取播放狀態
   - ✅ `user-modify-playback-state` - 控制播放
   - ✅ `user-read-currently-playing` - 讀取當前播放
   - ✅ `user-read-email` - 讀取用戶 email（用於資料庫儲存）

3. 點擊「Save」

**注意**：`user-read-email` 權限用於獲取用戶的 Spotify 帳號 email，並自動儲存到資料庫中，方便用戶管理和識別。

### 5. 設定環境變數

在您的 `.env` 檔案中設定：

```env
SPOTIFY_CLIENT_ID=你的_client_id
SPOTIFY_CLIENT_SECRET=你的_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

**生產環境**：
```env
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=https://your-domain.com/callback
```

## 🔍 驗證設定

### 測試 OAuth 流程

1. 啟動開發伺服器：`npm run dev`
2. 訪問 `http://localhost:3000`
3. 點擊「連接 Spotify」
4. 應該會跳轉到 Spotify 授權頁面
5. 授權後應該會回到應用

### 常見問題

#### Redirect URI 不匹配

**錯誤訊息**：`redirect_uri_mismatch`

**解決方法**：
- 確認 Spotify Dashboard 中的 Redirect URI 與 `.env` 中的設定完全一致
- 注意大小寫和尾部斜線
- 開發環境使用 `http://localhost:3000/callback`
- 生產環境使用 `https://your-domain.com/callback`

#### Invalid Client

**錯誤訊息**：`invalid_client`

**解決方法**：
- 確認 Client ID 和 Client Secret 正確
- 確認沒有多餘的空格
- 重新複製憑證

#### Invalid Scope

**錯誤訊息**：`invalid_scope`

**解決方法**：
- 確認所有必需的 Scopes 都已勾選
- 檢查應用設定中的「User Authorization Scopes」

## 📝 權限說明

### user-top-read
- **用途**：獲取用戶的熱門歌曲、藝人
- **必需**：是
- **理由**：用於顯示排行榜和分析

### user-read-recently-played
- **用途**：獲取最近播放記錄
- **必需**：是
- **理由**：用於時間段分析和歷史記錄同步

### user-read-playback-state
- **用途**：讀取當前播放狀態
- **必需**：是
- **理由**：顯示當前播放的歌曲

### user-modify-playback-state
- **用途**：控制播放（播放、暫停、切換歌曲）
- **必需**：是
- **理由**：允許用戶在應用中控制 Spotify 播放

### user-read-currently-playing
- **用途**：讀取當前播放的歌曲資訊
- **必需**：是
- **理由**：顯示當前播放詳情

### user-read-email
- **用途**：讀取用戶的 Spotify 帳號 email
- **必需**：是
- **理由**：自動將用戶 email 儲存到資料庫，方便用戶識別和管理

## ⚠️ 重要限制：用戶白名單

### Spotify API 用戶限制

**非企業帳號限制**：
- 免費/個人 Spotify Developer 帳號最多只能添加 **25 個用戶** 到白名單
- 這意味著只有前 25 個用戶可以完成 OAuth 授權
- 超過 25 個用戶後，新用戶將無法使用應用

### 如何管理白名單

1. 前往 [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. 選擇您的應用
3. 點擊「Users」標籤
4. 查看和管理已添加的用戶

### 解決方案

#### 選項 1：申請企業帳號（推薦用於公開應用）

1. 前往 [Spotify Developer Support](https://developer.spotify.com/support)
2. 申請 Extended Quota 或企業帳號
3. 需要提供商業資訊和應用使用情況

#### 選項 2：限制使用範圍

- 個人使用：25 個用戶通常足夠
- 小範圍測試：邀請特定用戶使用
- 內部工具：限制在公司或組織內部

#### 選項 3：使用 Spotify 的 Extended Quota

- 申請 Extended Quota 可以增加用戶限制
- 需要說明應用用途和使用情況
- 審核時間可能需要數週

### 注意事項

- **測試帳號**：開發和測試階段，建議只添加必要的測試帳號
- **定期清理**：移除不再使用的測試帳號，為新用戶騰出空間
- **用戶通知**：如果接近 25 人限制，考慮通知用戶或申請擴展

## 🔒 安全建議

1. **保護 Client Secret**
   - 永遠不要將 Client Secret 提交到 Git
   - 使用環境變數儲存
   - 定期輪換 Client Secret

2. **限制 Redirect URIs**
   - 只添加實際使用的 URI
   - 不要使用通配符
   - 定期檢查未使用的 URI

3. **監控使用情況**
   - 定期檢查 Spotify Dashboard 中的 API 使用統計
   - 注意異常的 API 調用
   - 監控白名單用戶數量

## 📞 需要幫助？

- [Spotify Web API 文檔](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth 指南](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- 提交 Issue 到 GitHub

