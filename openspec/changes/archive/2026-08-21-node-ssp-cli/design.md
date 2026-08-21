## Context

目前系統僅有網頁介面與暫時的 PowerShell 腳本。為了讓使用者能透過標準的命令列工具（CLI）直接對 Mailcloud 雲端硬碟進行操作，需要設計一套基於 Node.js 的模組化架構。

## Goals / Non-Goals

**Goals:**
- 提供輕量、跨平台的 Node.js CLI 工具。
- 自動處理 Cookie 保持與 CSRF `requesttoken` 擷取與傳遞。
- 支援登入、列出檔案、上傳、下載、刪除等核心功能。
- 將憑證安全地儲存於本機設定檔（`~/.ssp-config.json`）。

**Non-Goals:**
- 不實作複雜的桌面或圖形化介面（GUI）。
- 不處理非同步大量背景同步（僅提供命令式的單次操作）。

## Decisions

- **HTTP Client 選擇**: 使用 Node.js 原生 `fetch` 搭配 `tough-cookie`（或自訂 CookieJar 邏輯），以減少過多複雜依賴，確保輕量與穩定。
- **CLI Framework**: 使用 `commander` 套件來建立乾淨的指令結構與說明文件。
- **憑證與設定檔**: 使用 `os.homedir()` 取得使用者家目錄，建立 `.ssp-config.json` 儲存 Session 狀態與 Token。

## Risks / Trade-offs

- [Session 失效] → 當雲端 Session 過期時，CLI 應能自動重新登入或提示使用者重新執行 login 指令。
- [密碼安全性] → 儲存於本機的設定檔採用預設使用者目錄權限保護，避免其他行程讀取。
