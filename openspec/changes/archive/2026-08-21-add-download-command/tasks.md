## 1. 核心 API 實作

- [x] 1.1 在 `sspApi.js` 新增 `downloadFile(remotePath, localPath)` 方法，使用 WebDAV GET 協定
- [x] 1.2 實作進度追蹤（onDownloadProgress），計算百分比、大小、速度
- [x] 1.3 實作進度顯示函式，每 5% 更新，格式為「下載中... 65% (3.2 MB / 5.0 MB) @ 256 KB/s」

## 2. CLI 指令實作

- [x] 2.1 在 `cli.js` 新增 `download` 指令，參數為 `<remote-path> [local-destination]`
- [x] 2.2 實作目的地路徑處理（預設為目前目錄）
- [x] 2.3 實作下載成功/失敗訊息顯示

## 3. 測試與驗證

- [x] 3.1 執行 `node src/test.js` 確認模組載入正常
- [x] 3.2 測試下載功能（從 Mailcloud 下載小檔案）