# 📝 更新日誌

所有重要的變更都會記錄在此文件中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

## [Unreleased]

### Added
- 數據同步功能：自動同步用戶播放記錄到資料庫
- 資料庫遷移腳本和驗證工具
- 詳細的部署文檔和 Spotify 設定指南
- Cron Job 支援：每天自動同步所有用戶數據
- 用戶登入後自動觸發首次同步

### Changed
- 重構數據計算邏輯：如實呈現實際播放記錄，移除估算邏輯
- 遷移從 Vite 到 Next.js
- 改進錯誤處理和日誌記錄

### Fixed
- 修復時間窗口過濾邏輯
- 修復數據去重問題
- 改進同步功能的錯誤處理

## [0.1.0] - 2024-01-XX

### Added
- 初始版本發布
- Spotify OAuth 2.0 PKCE 認證
- 音樂數據分析功能（專輯、歌曲、藝人、曲風、時段）
- 數據快照功能
- 響應式設計
- 深色主題 UI

