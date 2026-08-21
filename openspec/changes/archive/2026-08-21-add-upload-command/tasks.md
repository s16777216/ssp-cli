## 1. 核心 API 實作

- [x] 1.1 在 `sspApi.js` 新增 `uploadFile(localPath, remotePath)` 方法，使用 WebDAV PUT 協定
- [x] 1.2 實作進度追蹤（onUploadProgress），計算百分比、大小、速度
- [x] 1.3 實作進度顯示函式，每 5% 更新，格式為「上傳中... 65% (3.2 MB / 5.0 MB) @ 256 KB/s」

## 2. CLI 指令實作

- [x] 2.1 在 `cli.js` 新增 `upload` 指令，參數為 `<local-file> <remote-path>`
- [x] 2.2 實作本地檔案存在性檢查，不存在則顯示錯誤並結束
- [x] 2.3 實作上傳成功/失敗訊息顯示

## 3. 測試與驗證

- [x] 3.1 執行 `node src/test.js` 確認模組載入正常
- [x] 3.2 測試上傳功能（上傳小檔案至 Mailcloud）