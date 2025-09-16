# Spotify OAuth「開放給所有人」上架手冊（App Review 指南）
版本：v1 · 2025-09-16

> 目的：把你的 Spotify Web/Tauri App 從「只限測試名單」升級為「所有 Spotify 使用者都能登入」。本手冊是一次到位的檢查清單 + 範本文案。

---

## A. 你要先確認的條件（前置）
- [ ] 已有 **Spotify Developer Dashboard** App，擁有 `Client ID`。
- [ ] 網站已可瀏覽（Vercel/自域名），並且 **OAuth 回呼頁**可正常運作（`/callback`）。
- [ ] **Redirect URIs**：Dashboard 中已新增 **Production** 站點的回呼 URL（例：`https://your-app.vercel.app/callback`）。
- [ ] 使用的 **Scopes** 已確定（只申請需要的最小集合）。
- [ ] 已準備好 **Privacy Policy URL** 與（可選）**Terms of Use URL**。

---

## B. 典型 Scopes 與申請理由（照抄可用，依你的 App 調整）
你的 App（Spotify Crate：唱片櫃 + 分析 + Connect 播放）常用：

- `user-top-read`（必需）  
  - **理由**：用於生成使用者近 4 週/6 個月/長期的「常聽」排行榜與封面牆。沒有此權限將無法顯示個人化唱片櫃。

- `user-read-recently-played`（建議）  
  - **理由**：用於補齊近期播放事件，提供 7/30/180/365 天的聆聽分析與趨勢圖；也用於個人化回顧。

- `user-read-playback-state`（如需裝置選擇/顯示播放狀態）  
  - **理由**：用於顯示與選擇播放裝置（Spotify Connect），並同步目前播放狀態，提供基本的播放控制體驗。

- `user-modify-playback-state`（如需播放/暫停/跳曲/轉移裝置）  
  - **理由**：用於一鍵播放專輯/歌單/收納夾、暫停/繼續，以及將播放轉移到指定裝置，提供完整的播放控制。

> 不申請：`streaming`（Web Playback SDK）除非你確實內嵌播放器；且需 Premium。若你以 Connect 控制外部裝置，無須申請。

---

## C. 送審要準備的素材清單（一次到位）
- [ ] **App 名稱與描述（英文）**：清楚說明產品價值與主要功能。
- [ ] **網站 URL**：Vercel Production 網址（例：`https://your-app.vercel.app`）。
- [ ] **隱私權政策（Privacy Policy URL）**：建議放在 `/privacy` 的公開頁面。
- [ ] **使用條款（Terms of Use URL）**（可選，但加分）：放在 `/terms`。
- [ ] **Scopes 申請理由**（如 B 節所寫）。
- [ ] **示範影片或 Demo 帳號（可選但非常加分）**：30–90 秒影片，展示登入 → 封面牆 → 分析 → 播放控制。
- [ ] **螢幕截圖**：登入頁、封面牆、分析儀表板、裝置列表/播放控制。
- [ ] **資料處理說明**：你如何存取/保存/刪除用戶資料（見 D/E 節）。

---

## D. 最小版《隱私權政策》樣板（可直接改字）
> 建議貼在 `https://your-app.vercel.app/privacy`。以下為簡化範例，請依實際情況補充。

**Privacy Policy — Spotify Crate**  
Last updated: 2025-09-16

1. **Data We Access**  
   - Spotify account basic profile as provided by Spotify OAuth.  
   - Listening data required for features you enable: top items (`user-top-read`), recently played (`user-read-recently-played`), playback state and device info (`user-read-playback-state`), playback control (`user-modify-playback-state`).

2. **Purpose of Use**  
   - Display your personal “shelf” of albums/artists and provide listening analytics.  
   - Let you start/stop/transfer playback via Spotify Connect.

3. **Storage & Retention**  
   - Web version: access tokens stored in browser storage; listening analysis results may be cached locally for performance.  
   - Desktop version: data stored locally (SQLite). We do **not** sell data.  
   - You may clear all local data at any time in Settings.

4. **Sharing**  
   - We do not share personal data with third parties.

5. **Deletion & Revocation**  
   - You can revoke access in Spotify’s account settings at any time.  
   - You can clear local data in the app: Settings → Data → Clear.

6. **Contact**  
   - Contact: support@yourdomain.com

> 若你上雲保存任何個資/事件，必須明確寫明保存項目、保存天數、與刪除流程。

---

## E. 合規要點（Spotify 審核常看）
- **最小必要權限**：只申請你真的會用到的 scopes。  
- **清楚的 UI 提示**：首次登入時提示用途（播放控制/分析）。  
- **資料刪除**：提供「清除本地資料」與撤銷授權說明。  
- **品牌規範**：遵守 Spotify 品牌與圖標使用規範（不要暗示官方合作）。  
- **不得繞過 DRM**：不內嵌受保護的串流，Connect 控制裝置是 OK 的。

---

## F. 審核表單填寫建議（英文示例，可修改）
**1. Describe your app and its core features.**  
“Spotify Crate is a personal dashboard that visualizes a user’s most-listened albums and artists as a cover ‘shelf’, provides 7/30/180/365-day listening analytics, and lets the user control playback on existing Spotify devices (Spotify Connect).”

**2. Why do you need each scope?**  
- `user-top-read`: “To compute and render the personalized shelf and rankings.”  
- `user-read-recently-played`: “To populate recent listening events for time-window analytics.”  
- `user-read-playback-state`: “To list devices and show current playback state.”  
- `user-modify-playback-state`: “To start/pause and transfer playback to a selected device.”

**3. How do you store user data?**  
“Web: browser storage only; optional local caches for charts. Desktop: local SQLite. No server-side personal data storage.”

**4. How can users revoke access / delete data?**  
“In Spotify account settings or via in-app Settings → Data → Clear. Detailed steps in our Privacy Policy.”

**5. Provide a Privacy Policy URL.**  
`https://your-app.vercel.app/privacy`

**6. Optional: demo video / account.**  
“30–90s screen recording showing login → shelf → analytics → playback control.”

---

## G. 提交流程（Dashboard → App Review）
1. 打開 **Spotify Developer Dashboard** → 選擇你的 App。  
2. 前往 **App Review** → 選擇要申請的 **Scopes**。  
3. 填寫 **描述**、**理由**、**隱私權政策 URL**、**網站 URL**、上傳 **截圖/影片**。  
4. 送出後等待審核（通常數天到數週）。  
5. 通過後即可對所有 Spotify 用戶開放登入；若被退件，依照建議修正再提交。

---

## H. 常見退件原因與修正
- **Scope 過多 / 無正當理由** → 只保留需要的，逐項說明使用情境。  
- **無/空白隱私權政策** → 至少放一個可公開存取的靜態頁。  
- **網站無法存取或 Callback 錯誤** → 確認 Vercel Production 網址可用、Redirect URIs 完全一致且已 URL-encode。  
- **品牌使用不當** → 移除不當 Logo 或聲稱。  
- **未描述資料刪除方式** → 在隱私政策與設定頁加入刪除與撤銷說明。

---

## I. 你可以在 Vercel 再補上的兩個頁面
- `/privacy`：貼上本手冊 D 節的樣板，改成你的品牌與聯絡方式。  
- `/terms`（可選）：簡短使用條款（禁止濫用、免責聲明）。

---

## J. 上線前的自我檢查（Final Checklist）
- [ ] Production 站可用、`/callback` 正常。  
- [ ] Dashboard → Redirect URIs 完全一致（大小寫、http/https、尾斜線、URL-encode）。  
- [ ] Scopes 僅列最小必要集合。  
- [ ] `/privacy` 上線且內容完整。  
- [ ] Demo 影片或截圖已準備。  
- [ ] 首次登入體驗有簡短說明「本 App 會做什麼」。  
- [ ] 在 **User Management** 依然保留測試帳號以便回歸測試。

---

## K. 附：審核期間的替代策略（Beta 閉測）
- 保持 **測試名單（最多 25 人）**，讓核心用戶先用。  
- 收集意見、修錯、補隱私條款與文案，再次送審。

---

若需要，我可以直接幫你產生 `/privacy` 與 `/terms` 的 React 頁面原始碼，或把本手冊嵌入你的專案文件。
