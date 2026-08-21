## Why

目前 node-ssp-cli 僅支援 login 和 list 功能，無法從 Mailcloud (SecuSharePro) 下載檔案。
使用者需要一個 CLI 工具來下載檔案至本地端。

## What Changes

- 新增 `download` 指令，支援從遠端下載檔案至本地
- 使用 WebDAV GET 協定下載（ownCloud 標準）
- 顯示下載進度（百分比 + 大小 + 速度）
- 預設下載至目前工作目錄，可指定目的地目錄
- 檔案名稱衝突自動 overwrite

## Capabilities

### New Capabilities

- `file-download`: 從 Mailcloud 下載檔案至本地端

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/download.js` 或擴充 `src/cli.js`
- 需擴充 `sspApi.js` 新增 `downloadFile()` 方法
- 依賴 WebDAV 端點：`/remote.php/dav/files/{username}/{path}`
- 需引入進度追蹤功能
