## 1. CLI 指令實作

- [x] 1.1 在 `cli.js` 新增 `delete` 指令，參數為 `<remote-path>`
- [x] 1.2 實作 readline 確認提示 `[y/N]`，預設為 N
- [x] 1.3 實作刪除成功/失敗訊息顯示

## 2. API 整合

- [x] 2.1 確認 `sspApi.js` 的 `deleteFile()` 方法可正確處理目錄與檔名
- [x] 2.2 整合確認邏輯與 API 呼叫

## 3. 測試與驗證

- [x] 3.1 執行 `node src/test.js` 確認模組載入正常
- [x] 3.2 測試刪除功能（刪除 Mailcloud 上的測試檔案）
