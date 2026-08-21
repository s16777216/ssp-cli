## Why

目前 node-ssp-cli 僅支援 login 和 list 功能，無法刪除 Mailcloud (SecuSharePro) 上的檔案。
使用者需要一個 CLI 工具來刪除不需要的檔案，並有確認機制防止誤刪。

## What Changes

- 新增 `delete` 指令，支援刪除指定路徑的檔案
- 使用 AJAX API 刪除（ownCloud 標準）
- 刪除前顯示確認提示，使用者輸入 `y` 才執行
- 顯示錯誤訊息並結束程式（如檔案不存在）

## Capabilities

### New Capabilities

- `file-delete`: 刪除 Mailcloud 遠端檔案

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/delete.js` 或擴充 `src/cli.js`
- 已有 `sspApi.js` 的 `deleteFile()` 方法，需擴充確認邏輯
- 依賴 AJAX 端點：`/index.php/apps/files/ajax/delete.php`
