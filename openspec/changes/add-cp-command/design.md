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
- 使用 WebDAV COPY 協定
- 預設不遞迴複製資料夾（符合 Unix cp 行為），支援 `-r` 遞迴
- 支援 `-i` 旗標：目標存在時互動確認

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

**替代方案：**
- AJAX API (`/index.php/apps/files/ajax/copy.php`)：較舊的內部 API

**選擇理由：** WebDAV COPY 是 RFC 4918 標準方法，ownCloud/Nextcloud 完整支援。

### D2: 遞迴預設值

| 指令 | 行為 |
|------|------|
| `cp <src> <dst>` | 檔案複製，資料夾報錯 `錯誤: 來源為資料夾，請使用 -r` |
| `cp -r <src> <dst>` | 遞迴複製資料夾及其內容 |

**選擇理由：** 符合 Unix `cp` 行為（預設不遞迴），避免意外大量複製。

### D3: 指令格式

```bash
ssp cp <src> <dst>
ssp cp -r <src> <dst>
ssp cp -i <src> <dst>
ssp cp -ri <src> <dst>
```

### D4: 目標存在時行為

同 `mv`：預設報錯，`-i` 互動確認。

### D5: 目標為目錄時

同 `mv`：目標為目錄時，複製入該目錄並保留原檔名。

## Risks / Trade-offs

- **大資料夾複製效能**：逐個檔案 COPY 請求 → 大資料夾較慢
- **權限複製**：WebDAV COPY 可能不保留所有屬性
- **大檔案複製**：透過伺服器端複製，不經本地，速度較快