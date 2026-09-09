## Why

目前 node-ssp-cli 支援 login、ls、rm、upload、download、mkdir 指令，但缺少移動/重命名檔案的功能。使用者需要在 Mailcloud (SecuSharePro) 上移動或重命名檔案/資料夾，目前只能透過網頁介面操作。

## What Changes

- 新增 `mv` 指令，支援移動/重命名遠端檔案/資料夾
- 使用 WebDAV MOVE 協定
- 目標已存在時預設 readline 互動確認（`覆蓋？ [y/N]`）；`-y` / `--yes` 自動覆蓋/跳過確認
- 目標路徑一律當作目標完整路徑直寫，不自動移入目錄

## Capabilities

### New Capabilities

- `file-move`: 移動/重命名 Mailcloud 遠端檔案/資料夾

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/mv.js` 指令模組
- 需擴充 `sspApi.js` 新增 `moveFile()` 方法
- 依賴 WebDAV 端點：`MOVE /remote.php/webdav/{src}` + `Destination` header
- 無新增相依套件