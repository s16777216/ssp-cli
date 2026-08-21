## Why

目前 node-ssp-cli 支援 `ls` 列出指定目錄的檔案，但缺少搜尋功能。使用者需要在 Mailcloud (SecuSharePro) 上搜尋檔案，目前只能透過網頁介面或逐層 `ls` 查找。

## What Changes

- 新增 `search` 指令，支援搜尋遠端檔案
- 使用 AJAX 搜尋端點：`GET /index.php/apps/files/ajax/search.php?search=<keyword>`
- 預設搜尋檔名，支援 `-c` / `--content` 搜尋檔案內容
- 支援 `-t` / `--type` 限定類型：`file` / `dir` / `all`
- 支援 `--json` 輸出 JSON 格式（適合腳本解析）
- 預設輸出表格格式（同 `ls` 風格）

## Capabilities

### New Capabilities

- `file-search`: 搜尋 Mailcloud 遠端檔案

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/search.js` 指令模組
- 需擴充 `sspApi.js` 新增 `searchFiles()` 方法
- 依賴 AJAX 端點：`GET /index.php/apps/files/ajax/search.php`
- 無新增相依套件