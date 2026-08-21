## Why

目前 node-ssp-cli 支援 login、ls、rm、upload、download 指令，但缺少建立遠端資料夾的功能。使用者需要在 Mailcloud (SecuSharePro) 上建立資料夾來組織檔案，目前只能透過網頁介面操作，無法自動化或腳本化。

## What Changes

- 新增 `mkdir` 指令，支援在遠端建立資料夾
- 使用 WebDAV MKCOL 協定建立資料夾
- 支援 `-p` / `--parents` 旗標遞迴建立父目錄
- 資料夾已存在時顯示錯誤並結束（符合 Unix mkdir 行為）

## Capabilities

### New Capabilities

- `folder-create`: 在 Mailcloud 遠端建立資料夾

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/mkdir.js` 指令模組
- 需擴充 `sspApi.js` 新增 `createFolder()` 方法
- 依賴 WebDAV 端點：`MKCOL /remote.php/webdav/{path}`
- 無新增相依套件