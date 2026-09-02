## Why

`ssp upload` 指令在目標路徑結尾帶 `/`（例如 `ssp upload ./local.pdf /Docs/`，README 標榜支援的上傳到目錄用法）時會失敗，伺服器回傳 `PUT is not allowed on non-files`。實際測試證實 `uploadFile()` 把整個目錄路徑直接當成 WebDAV PUT 目標，完全沒有將本機檔名拼接上去，導致指向目錄本身而無法上傳。

## What Changes

- 修正 `uploadFile()` 的目標路徑解析邏輯：當 `remotePath` 結尾為 `/`（代表目錄）時，系統自動將本機檔名（`path.basename(localPath)`）拼接至目錄路徑後再上傳。
- 保留現有行為：使用者指定完整檔案路徑（如 `ssp upload ./file.txt /remote.txt`）時，行為不變。
- 同步修正 README 中 `ls` 指令的用法說明（`ssp ls /` → `ssp ls -d /`），以符合實際 CLI 介面。

## Capabilities

### New Capabilities
<!-- 無新增 capability -->

### Modified Capabilities
- `file-upload`: 擴充 `uploadFile` 的目標路徑處理——支援「上傳到目錄」（remotePath 結尾帶 `/`）時自動拼接本機檔名，使 `ssp upload <local-file> <directory/>` 可正常運作。

## Impact

- **程式碼**：`src/client/sspApi.js` 的 `uploadFile()` 方法（目標路徑解析邏輯）。
- **文件**：`README.md` 的指令用法說明。
- **介面**：CLI `upload` 指令的 `<remote-path>` 參數語意——現在額外支援目錄目標（結尾帶 `/`）。
- **無**：不需新增依賴、不影響其他指令（login/ls/mkdir/download/rm）。
