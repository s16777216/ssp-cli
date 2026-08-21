## Why

目前需要透過手動操作瀏覽器或臨時的 PowerShell 腳本來與 Mailcloud 企業雲端檔案服務互動，缺乏自動化及標準化的命令列介面（CLI），無法有效支援日常的檔案管理與自動化排程需求。

## What Changes

- 建立一個基於 Node.js 的命令列工具（CLI），支援登入驗證、維持 Session、以及對 Mailcloud 雲端硬碟的檔案進行基本操作。
- 支援透過命令列參數（Flags）執行指令。
- 支援將認證憑證與 Session 儲存於本機設定檔（如 `~/.ssp-config.json`），免去重複登入。
- 實作核心檔案操作（CRUD）：登入、列出檔案 (list)、上傳 (upload)、下載 (download)、刪除 (delete)。

## Capabilities

### New Capabilities
- `ssp-cli-core`: 封裝 Mailcloud API 的 Node.js 核心客戶端，處理 Cookie 保持、CSRF `requesttoken` 自動抓取與驗證。
- `ssp-cli-commands`: 提供命令列介面與對應指令（login, list, upload, download, delete）。

### Modified Capabilities
- (無現有規格需要修改)

## Impact

- 建立新的 Node.js 專案結構與依賴套件（如 `axios`、`commander` 等）。
- 影響本機設定檔目錄（建立 `~/.ssp-config.json`）。
