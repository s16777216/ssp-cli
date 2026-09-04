## Context

node-ssp-cli 目前支援 login、ls、rm、upload、download、mkdir 指令。需要新增複製功能讓使用者可以在 Mailcloud (ownCloud) 上複製檔案/資料夾。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（listFiles, deleteFile, uploadFile, downloadFile, createFolder）
- `cli.js`：CLI 入口，使用 commander
- `commands/`：各指令獨立模組

## Goals / Non-Goals

**Goals:**

- 新增 `ssp cp <src> <dst>` 指令
- 使用 WebDAV COPY 協定（資料夾遞迴 = 單一請求、伺服器端處理）
- 資料夾複製須帶 `-r` 遞迴旗標，否則報錯
- 目標已存在時預設 readline 互動確認；`-y` 自動覆蓋/跳過確認

**Non-Goals:**

- 不支援批次複製多個來源（未來擴充）
- 不支援保留屬性（時間戳、權限等）

## Decisions

### D1: 使用 WebDAV COPY 協定

ownCloud 的標準複製方式是透過 WebDAV COPY：

```
COPY /remote.php/webdav/{src}
Destination: /remote.php/webdav/{dst}
Headers: requesttoken, X-Requested-With, Overwrite: F
```

**不送 `Depth` header**：依據 RFC 4918 §9.9「Servers SHOULD treat a request without a Depth header as if a 'Depth: infinity' header was included」，ownCloud/Nextcloud 對資料夾的 COPY 預設即遞迴複製整個樹。因此資料夾與檔案在請求層面一致，都是單一 COPY 請求，伺服器端處理遞迴。

**替代方案：**
- AJAX API (`/index.php/apps/files/ajax/copy.php`)：較舊的內部 API

**選擇理由：** WebDAV COPY 是 RFC 4918 標準方法，ownCloud/Nextcloud 完整支援；資料夾遞迴為伺服器端單一請求，不需逐項遍歷。

### D2: 遞迴預設值

| 指令 | 行為 |
|------|------|
| `cp <src> <dst>` | 檔案複製；來源為資料夾時報錯 `錯誤: 來源為資料夾，請使用 -r` |
| `cp -r <src> <dst>` | 複製資料夾及其內容（單一 COPY，伺服器端遞迴） |

來源為檔案時 `-r` 為 no-op（直接 COPY，不需額外判斷分支）。

**選擇理由：** 符合 Unix `cp` 行為（預設不遞迴資料夾），避免意外大量複製。

### D3: 指令格式

```bash
ssp cp <src> <dst>        # 複製檔案
ssp cp -r <src> <dst>     # 遞迴複製資料夾
ssp cp -y <src> <dst>     # 目標已存在時自動覆蓋（跳過確認）
```

### D4: 目標存在時行為

| 模式 | 行為 |
|------|------|
| 預設 | readline 互動提示 `目標已存在，覆蓋？ [y/N]`，輸入 `y` 才覆蓋（重發 COPY + `Overwrite: T`） |
| `-y` / `--yes` | 目標已存在時自動覆蓋，不提示 |

預設即互動（與 `rm` 一致），因此**不提供 `-i` 旗標**——它在新模型下是冗餘的。

判斷目標已存在：發送 COPY（`Overwrite: F`），接收 `412 Precondition Failed` 反推。

### D5: 目標路徑解讀

`<dst>` 一律當作目標完整路徑直寫（複製到該確切位置），**不自動判斷目標是否為目錄而移入**。此行為與 Unix `cp` 的 `-T` 語義一致，避免不可預期的路徑變異。

### D6: 來源類型判斷

以 `statPath(src)`（WebDAV `PROPFIND` Depth:0）判斷來源為檔案還是資料夾（collection），決定是否需要 `-r`。

## Risks / Trade-offs

- **資料夾遞迴依賴伺服器**：資料夾 COPY 遞迴靠 ownCloud 伺服器端行為，若伺服器未依 RFC 遞迴（極少見），複製會不完整 → 依賴標準，不另行實作 client 端遍歷 fallback
- **權限複製**：WebDAV COPY 可能不保留所有屬性
- **大檔案複製**：透過伺服器端複製，不經本地，速度較快