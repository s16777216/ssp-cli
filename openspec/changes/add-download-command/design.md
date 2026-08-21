## Context

node-ssp-cli 目前支援 login 和 list 指令。需要新增 download 功能讓使用者可以從 Mailcloud (ownCloud) 伺服器下載檔案。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（目前僅 listFiles, deleteFile）
- `cli.js`：CLI 入口，使用 commander

## Goals / Non-Goals

**Goals:**

- 新增 `ssp download <遠端路徑> [本地目的地]` 指令
- 使用 WebDAV GET 協定下載檔案
- 顯示下載進度（百分比 + 大小 + 速度）
- 預設下載至目前工作目录，可指定目的地目錄
- 檔案名稱衝突自動 overwrite

**Non-Goals:**

- 不支援多檔下載（未來擴充）
- 不支援斷點續傳（未來擴充）
- 不支援資料夾下載（未來擴充）

## Decisions

### D1: 使用 WebDAV GET 協定

ownCloud 的標準下載方式是透過 WebDAV：

```
GET /remote.php/dav/files/{username}/{remote-path}
```

**替代方案：**
- 直接 HTTP GET（無 WebDAV header）：可能缺少權限資訊

**選擇理由：** WebDAV 是 ownCloud/Nextcloud 的標準協定，穩定且文件完整。

### D2: 進度追蹤使用 axios onDownloadProgress

```javascript
axios.get(url, {
  responseType: 'stream',
  onDownloadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    // 顯示進度
  }
});
```

**替代方案：**
- 使用原生 XMLHttpRequest：較複雜

**選擇理由：** axios 已內建支援，無需額外依賴。

### D3: 指令格式

```bash
ssp download <遠端路徑> [本地目的地]
```

範例：
```bash
# 下載至目前目錄
ssp download /Documents/report.pdf

# 下載至指定目錄
ssp download /Documents/report.pdf ./backups/
```

**選擇理由：** 簡潔直觀，符合 Unix 工具風格。

### D4: 進度顯示格式

```
下載中... 65% (3.2 MB / 5.0 MB) @ 256 KB/s
```

每 5% 更新一次，單行更新（使用 `\r` 回車覆蓋）。

## Risks / Trade-offs

- **大檔記憶體使用**：目前使用 stream 下載，應不會占用大量記憶體
- **速度計算精度**：使用簡單的 bytes/time 計算，可能不夠精確 → 可接受的簡化
- **網路中斷**：不支援斷點續傳，中斷需重新下載 → 目前可接受，未來可擴充
