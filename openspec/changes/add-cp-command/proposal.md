## Why

目前 node-ssp-cli 支援 login、ls、rm、upload、download、mkdir 指令，但缺少複製檔案/資料夾的功能。使用者需要在 Mailcloud (SecuSharePro) 上複製檔案或資料夾到其他位置，目前只能透過網頁介面操作。

## What Changes

- 新增 `cp` 指令，支援複製遠端檔案/資料夾
- 使用 WebDAV COPY 協定（不送 `Depth` header，靠 RFC 4918「無 header 視同 infinity」達成資料夾遞迴）
- 資料夾複製須帶 `-r` / `--recursive`，否則報錯 `錯誤: 來源為資料夾，請使用 -r`
- 目標已存在時預設 readline 互動確認（`覆蓋？ [y/N]`）；`-y` / `--yes` 自動覆蓋/跳過確認
- 目標路徑一律當作目標完整路徑直寫，不自動移入目錄

## Capabilities

### New Capabilities

- `file-copy`: 複製 Mailcloud 遠端檔案/資料夾

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/cp.js` 指令模組
- 需擴充 `sspApi.js` 新增 `copyFile()` 與 `statPath()` 方法（後者以 PROPFIND Depth:0 判斷來源為檔案/資料夾）
- 依賴 WebDAV 端點：`COPY /remote.php/webdav/{src}` + `Destination` header
- 無新增相依套件