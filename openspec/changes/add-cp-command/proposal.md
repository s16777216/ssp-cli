## Why

目前 node-ssp-cli 支援 login、ls、rm、upload、download、mkdir 指令，但缺少複製檔案/資料夾的功能。使用者需要在 Mailcloud (SecuSharePro) 上複製檔案或資料夾到其他位置，目前只能透過網頁介面操作。

## What Changes

- 新增 `cp` 指令，支援複製遠端檔案/資料夾
- 使用 WebDAV COPY 協定
- 預設不遞迴複製資料夾（符合 Unix cp 行為），支援 `-r` / `--recursive` 遞迴複製
- 支援 `-i` / `--interactive` 旗標：目標存在時互動確認
- 目標路徑為目錄時，自動複製入該目錄（保留原檔名）

## Capabilities

### New Capabilities

- `file-copy`: 複製 Mailcloud 遠端檔案/資料夾

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/cp.js` 指令模組
- 需擴充 `sspApi.js` 新增 `copyFile()` 方法
- 依賴 WebDAV 端點：`COPY /remote.php/webdav/{src}` + `Destination` header
- 無新增相依套件