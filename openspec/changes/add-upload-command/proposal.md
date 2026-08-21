## Why

目前 node-ssp-cli 僅支援 login 和 list 功能，無法上傳檔案至 Mailcloud (SecuSharePro)。
使用者需要一個 CLI 工具來批次或自動化檔案上傳作業。

## What Changes

- 新增 `upload` 指令，支援單檔上傳至指定遠端路徑
- 使用 WebDAV PUT 協定上傳（ownCloud 標準）
- 顯示上傳進度（百分比 + 大小 + 速度）
- 自動覆蓋已存在的檔案（API 預設行為）

## Capabilities

### New Capabilities

- `file-upload`: 上傳本地檔案至 Mailcloud 遠端目錄

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/upload.js` 或擴充 `src/cli.js`
- 需擴充 `sspApi.js` 新增 `uploadFile()` 方法
- 依賴 WebDAV 端點：`/remote.php/dav/files/{username}/{path}`
- 需引入進度追蹤功能（可能需使用 axios onUploadProgress）
