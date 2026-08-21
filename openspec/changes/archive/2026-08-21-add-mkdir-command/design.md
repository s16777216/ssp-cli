## Context

node-ssp-cli 目前支援 login、ls、rm、upload、download 指令。需要新增 mkdir 功能讓使用者可以在 Mailcloud (ownCloud) 上建立資料夾。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（listFiles, deleteFile, uploadFile, downloadFile）
- `cli.js`：CLI 入口，使用 commander
- `commands/`：各指令獨立模組

## Goals / Non-Goals

**Goals:**

- 新增 `ssp mkdir <remote-path>` 指令
- 使用 WebDAV MKCOL 協定建立資料夾
- 支援 `-p` / `--parents` 旗標遞迴建立父目錄
- 資料夾已存在時顯示錯誤並結束

**Non-Goals:**

- 不支援一次建立多個資料夾（未來擴充）
- 不支援互動模式確認覆蓋
- 不支援設定資料夾權限（未來擴充）

## Decisions

### D1: 使用 WebDAV MKCOL 協定

ownCloud 的標準建立資料夾方式是透過 WebDAV MKCOL：

```
MKCOL /remote.php/webdav/{path}
Headers: requesttoken, X-Requested-With: XMLHttpRequest
```

**替代方案：**
- AJAX API (`/index.php/apps/files/ajax/newfolder.php`)：較舊的內部 API，參數較複雜

**選擇理由：** WebDAV MKCOL 是 RFC 4918 標準方法，ownCloud/Nextcloud 完整支援，無需額外解析回應格式。

### D2: 指令格式

```bash
ssp mkdir <remote-path>
ssp mkdir -p <remote-path>
```

範例：
```bash
ssp mkdir /Documents/NewFolder
ssp mkdir -p /Documents/Projects/NewProject
```

**選擇理由：** 符合 Unix `mkdir` 命令慣例，直觀易用。

### D3: 遞迴建立邏輯 (`-p`)

當指定 `-p` 旗標時：
1. 解析路徑分段
2. 從根目錄開始逐層嘗試建立
3. 忽略已存在的目錄（不報錯）
3. 最後建立目標資料夾

**替代方案：**
- 單次 MKCOL 請求，依賴伺服器端遞迴：不支援

**選擇理由：** 客戶端控制邏輯更可靠，可精確控制錯誤處理。

### D4: 錯誤處理

| 情境 | 行為 |
|------|------|
| 資料夾已存在 | 顯示錯誤 `錯誤: 資料夾已存在 - <path>`，結束碼 1 |
| 父目錄不存在 (無 -p) | 顯示錯誤 `錯誤: 父目錄不存在`，結束碼 1 |
| 權限不足 | 顯示伺服器回傳錯誤訊息，結束碼 1 |
| 網路錯誤 | 顯示錯誤訊息，結束碼 1 |

## Risks / Trade-offs

- **中文/特殊字元路徑**：WebDAV 路徑需正確 URL 編碼 → 使用 `encodeURIComponent` 處理
- **伺服器不支援 MKCOL**：極少見，ownCloud 標準支援 → 可接受風險
- **遞迴建立效能**：多次 HTTP 請求 → 目錄層級通常不深，可接受