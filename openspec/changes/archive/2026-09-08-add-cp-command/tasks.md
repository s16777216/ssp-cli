## 1. 核心 API 實作

- [x] 1.1 在 `sspApi.js` 新增 `copyFile(src, dst, options)` 方法，使用 WebDAV COPY 協定（不送 `Depth` header），支援 `Overwrite: T/F`
- [x] 1.2 在 `sspApi.js` 新增 `statPath(remotePath)` 方法，以 WebDAV `PROPFIND` Depth:0 判斷來源為檔案（file）或資料夾（collection）
- [x] 1.3 實作目標存在檢查（`412` 反推）與覆蓋邏輯（`Overwrite: T` 重試）
- [x] 1.4 實作錯誤處理：412（目標已存在）、404（來源不存在）、403（權限不足），其餘 catch-all

## 2. CLI 指令實作

- [x] 2.1 在 `cli.js` 新增 `cp` 指令，參數為 `<src> <dst>`
- [x] 2.2 實作 `-r` / `--recursive` 旗標（來源為資料夾且無 `-r` 時報錯 `錯誤: 來源為資料夾，請使用 -r`；來源為檔案時 `-r` 為 no-op）
- [x] 2.3 實作 `-y` / `--yes` 旗標；預設目標已存在時以 readline 互動提示 `目標已存在，覆蓋？ [y/N]`
- [x] 2.4 實作複製成功/失敗訊息顯示（成功 `複製完成: <dst>`）

## 3. 測試與驗證

- [x] 3.1 執行 `npm test`（`node --test`）確認模組載入正常（註：`node src/test.js` 不存在，實際測試命令為 `npm test`）
- [x] 3.2 測試複製功能（`test/copy.test.js`：COPY 請求/Overwrite header、statPath file/collection 判斷）
- [x] 3.3 測試錯誤情境（`test/copy.test.js`：412/404/403/5xx 錯誤對映）