# 🤝 貢獻指南

感謝您對 Spotify Crate 的興趣！我們歡迎所有形式的貢獻。

## 📋 如何貢獻

### 報告問題

如果您發現了 bug 或有功能建議：

1. 檢查 [Issues](https://github.com/Waynting/Spotify_Statistic/issues) 確認問題尚未被報告
2. 創建新的 Issue，包含：
   - 清晰的標題
   - 詳細的問題描述
   - 重現步驟
   - 預期行為 vs 實際行為
   - 環境資訊（Node.js 版本、作業系統等）

### 提交 Pull Request

1. Fork 本專案
2. 創建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 開啟 Pull Request

## 🛠️ 開發環境設定

### 1. 克隆專案

```bash
git clone https://github.com/Waynting/Spotify_Statistic.git
cd Spotify_Statistic
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 填入您的配置
```

### 4. 設定資料庫

```bash
# 執行遷移
npx tsx app/server/migrations/run-migrations.ts
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

## 📝 代碼規範

### TypeScript

- 使用 TypeScript 嚴格模式
- 為所有函數添加類型註解
- 避免使用 `any`，優先使用具體類型

### 代碼風格

- 使用 2 空格縮進
- 使用單引號
- 行尾不要有分號（除非必要）
- 函數和變數使用 camelCase
- 組件使用 PascalCase

### 提交訊息

使用清晰的提交訊息：

```
feat: 添加新功能
fix: 修復 bug
docs: 更新文檔
style: 代碼格式調整
refactor: 重構代碼
test: 添加測試
chore: 構建過程或輔助工具的變動
```

## 🧪 測試

在提交 PR 前，請確保：

- [ ] 代碼通過 TypeScript 檢查：`npm run build`
- [ ] 沒有 linter 錯誤
- [ ] 功能在本地測試正常
- [ ] 更新相關文檔

## 📚 專案結構

```
app/
├── components/      # React 組件
├── api/            # Next.js API Routes
├── server/         # 後端服務和模型
├── lib/            # 工具庫
└── types/          # TypeScript 類型定義
```

詳細結構請參考 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🎯 優先事項

我們特別歡迎以下貢獻：

- 🐛 Bug 修復
- 📊 新的分析功能
- 🎨 UI/UX 改進
- 📝 文檔改進
- ⚡ 效能優化
- 🌐 多語言支援

## ❓ 問題？

如果您有任何問題，請：

1. 查看現有文檔
2. 搜尋 Issues
3. 創建新的 Issue 詢問

感謝您的貢獻！🎉

