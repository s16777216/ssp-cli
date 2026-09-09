## 1. 核心 API 實作

- [x] 1.1 在 `sspApi.js` 新增 `searchFiles(keyword, options)` 方法，使用 AJAX 搜尋端點
- [x] 1.2 實作關鍵字 URL 編碼
- [x] 1.3 實作類型篩選、內容搜尋選項

## 2. CLI 指令實作

- [x] 2.1 在 `cli.js` 新增 `search` 指令，參數為 `<keyword>`
- [x] 2.2 實作 `-c` / `--content` 旗標
- [x] 2.3 實作 `-t` / `--type` 旗標
- [x] 2.4 實作 `--json` 輸出選項
- [x] 2.5 實作搜尋結果表格顯示（複用 `utils.js` 的表格功能）

## 3. 測試與驗證

- [x] 3.1 執行 `npm test`（`node --test`）確認模組載入正常（註：`node src/test.js` 不存在，實際測試命令為 `npm test`）
- [x] 3.2 測試基本檔名搜尋
- [x] 3.2 測試內容搜尋 `-c`
- [x] 3.3 測試類型篩選 `-t file/dir`
- [x] 3.4 測試 JSON 輸出 `--json`