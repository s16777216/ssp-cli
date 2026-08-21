## Context

node-ssp-cli 目前支援 login、ls、rm、upload、download、mkdir 指令。需要新增移動/重命名功能讓使用者可以在 Mailcloud (ownCloud) 上移動或重命名檔案/資料夾。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（listFiles, deleteFile, uploadFile, downloadFile, createFolder）
- `cli.js`：CLI 入口，使用 commander
- `commands/`：各指令獨立模組

## Goals / Non-Goals

**Goals:**

- 新增 `ssp mv <src> <dst>` 指令
- 使用 WebDAV MOVE 協定
- 支援 `-i` / `--interactive` 旗標：目標存在時互動確認
- 目標為目錄時，自動移入該目錄（保留原檔名）

**Non-Goals:**

- 不支援批次移動多個來源（未來擴充）
- 不支援跨儲存空間移動（需複製+刪除）

## Decisions

### D1: 使用 WebDAV MOVE 協定

ownCloud 的標準移動方式是透過 WebDAV MOVE：

```
MOVE /remote.php/webdav/{src}
Destination: /remote.php/webdav/{dst}
Headers: requesttoken, X-Requested-With, Overwrite: F
```

**替代方案：**
- AJAX API (`/index.php/apps/files/ajax/move.php`)：較舊的內部 API

**選擇理由：** WebDAV MOVE 是 RFC 4918 標準方法，ownCloud/Nextcloud 完整支援。

### D2: 指令格式

```bash
ssp mv <src> <dst>
ssp mv -i <src> <dst>
```

範例：
```bash
ssp mv /Documents/old.txt /Documents/new.txt      # 重命名
ssp mv /Documents/file.txt /Archive/              # 移動到目錄
ssp mv -i /src.txt /dst.txt                       # 互動確認
```

**選擇理由：** 符合 Unix `mv` 命令慣例。

### D3: 目標存在時的行為

| 模式 | 行為 |
|------|------|
| 預設 | 報錯 `錯誤: 目標已存在 - <dst>`，結束碼 1 |
| `-i` / `--interactive` | 詢問 `目標已存在，覆蓋？ [y/N]`，輸入 `y` 才覆蓋 |

**選擇理由：** 符合 Unix `mv -i` 行為，安全預設值。

### D4: 目標為目錄時的行為

- 當 `<dst>` 為現有目錄 → 將 `<src>` 移入該目錄，檔名保持不變
- 當 `<dst>` 不存在且以 `/` 結尾 → 視為目錄，自動建立（類似 `mkdir -p`）

## Risks / Trade-offs

- **跨儲存空間移動**：WebDAV MOVE 可能不支援跨儲存 → 需 fallback 複製+刪除（未來擴充）
- **中文/特殊字元路徑**：需正確 URL 編碼 → 使用 `encodeURIComponent`
- **大量移動效能**：逐個請求 → 批次操作未來擴充