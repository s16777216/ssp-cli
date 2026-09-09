## Context

node-ssp-cli 目前支援 login、ls、rm、upload、download、mkdir 指令。需要新增移動/重命名功能讓使用者可以在 Mailcloud (ownCloud) 上移動或重命名檔案/資料夾。

現有架構：
- sspClient.js：核心 HTTP Client，處理登入、Cookie、CSRF Token
- sspApi.js：API 方法（listFiles, deleteFile, uploadFile, downloadFile, createFolder, copyFile, statPath, searchFiles）
- cli.js：CLI 入口，使用 commander
- commands/：各指令獨立模組

## Goals / Non-Goals

**Goals:**

- 新增 ssp mv <src> <dst> 指令
- 使用 WebDAV MOVE 協定
- 目標已存在時預設 readline 互動確認；-y 自動覆蓋/跳過確認
- 目標路徑一律當作目標完整路徑直寫，不自動移入目錄

**Non-Goals:**

- 不支援批次移動多個來源（未來擴充）
- 不支援跨儲存空間移動（需複製+刪除）

## Decisions

### D1: 使用 WebDAV MOVE 協定

ownCloud 的標準移動方式是透過 WebDAV MOVE：

`
MOVE /remote.php/webdav/{src}
Destination: /remote.php/webdav/{dst}
Headers: requesttoken, X-Requested-With, Overwrite: F
`

**替代方案：**
- AJAX API (/index.php/apps/files/ajax/move.php)：較舊的內部 API

**選擇理由：** WebDAV MOVE 是 RFC 4918 標準方法，ownCloud/Nextcloud 完整支援。

### D2: 指令格式

`ash
ssp mv <src> <dst>        # 移動/重命名
ssp mv -y <src> <dst>     # 目標已存在時自動覆蓋（跳過確認）
`

範例：
`ash
ssp mv /Documents/old.txt /Documents/new.txt      # 重命名
ssp mv -y /src.txt /dst.txt                       # 自動覆蓋
`

**選擇理由：** 符合 Unix mv 命令慣例。**不提供 -i 旗標**——預設即互動模式，與 cp 一致。

### D3: 目標存在時的行為

| 模式 | 行為 |
|------|------|
| 預設 | readline 互動提示 目標已存在，覆蓋？ [y/N]，輸入 y 才覆蓋（重發 MOVE + Overwrite: T） |
| -y / --yes | 目標已存在時自動覆蓋，不提示 |

判斷目標已存在：發送 MOVE（Overwrite: F），接收 412 Precondition Failed 反推。

### D4: 目標路徑解讀

<dst> 一律當作目標完整路徑直寫（移動到該確切位置），**不自動判斷目標是否為目錄而移入**。此行為與 Unix mv 的 -T 語義一致，避免不可預期的路徑變異。

### D5: 來源驗證

在發送 MOVE 前，先以 statPath(src)（WebDAV PROPFIND Depth:0）驗證來源存在。若來源不存在，回傳清晰錯誤 Error: 來源不存在 - <src>，而非原始 404。

### D6: 跨儲存空間移動

WebDAV MOVE 僅支援同一儲存空間。若檢測到跨儲存（或伺服器回傳不支援錯誤），回傳錯誤 Error: 不支援跨儲存空間移動，請改用 cp + rm。使用者需手動 cp + m。

### D7: 目標父目錄處理

若目標路徑的父目錄不存在，回傳錯誤 Error: 目標目錄不存在。**不自動建立父目錄**（標準 mv 行為）。使用者需先確保父目錄存在。

### D8: 進度回饋

WebDAV MOVE 僅操作中繼資料，通常瞬間完成。**不顯示進度指示器**，僅顯示結果訊息。

### D9: 錯誤訊息格式與結束碼

| 情況 | 輸出 | 結束碼 |
|------|------|--------|
| 成功（含覆蓋） | 移動完成: <dst> | 0 |
| 來源不存在 | Error: 來源不存在 - <src> | 非零 |
| 目標已存在（使用者取消） | 已取消移動 | 0 |
| 跨儲存空間 | Error: 不支援跨儲存空間移動，請改用 cp + rm | 非零 |
| 目標父目錄不存在 | Error: 目標目錄不存在 | 非零 |
| 權限不足 | Error: 權限不足 | 非零 |
| 其他錯誤 | Error: <server message> | 非零 |

錯誤訊息使用英文前綴 Error:，與 ls、upload、download 一致。

## Risks / Trade-offs

- **跨儲存空間移動**：WebDAV MOVE 可能不支援跨儲存 → 需 fallback 複製+刪除（未來擴充）
- **中文/特殊字元路徑**：需正確 URL 編碼 → 使用 encodeURIComponent
- **大量移動效能**：逐個請求 → 批次操作未來擴充
