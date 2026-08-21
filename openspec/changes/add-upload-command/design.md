## Context

node-ssp-cli 目前支援 login 和 list 指令。需要新增 upload 功能讓使用者可以上傳檔案至 Mailcloud (ownCloud) 伺服器。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（目前僅 listFiles, deleteFile）
- `cli.js`：CLI 入口，使用 commander

## Goals / Non-Goals

**Goals:**

- 新增 `ssp upload <本地檔案> <遠端路徑>` 指令
- 使用 WebDAV PUT 協定上傳檔案
- 顯示上傳進度（百分比 + 大小 + 速度）
- 支援自動覆蓋已存在檔案

**Non-Goals:**

- 不支援多檔上傳（未來擴充）
- 不支援斷點續傳（未來擴充）
- 不支援資料夾上傳（未來擴充）

## Decisions

### D1: 使用 WebDAV PUT 協定

ownCloud 的標準上傳方式是透過 WebDAV：

```
PUT /remote.php/dav/files/{username}/{remote-path}
```

**替代方案：**
- AJAX 上傳 (`/index.php/apps/files/ajax/upload.php`)：較舊的 API，不推薦
-.chunk 上傳：適用於大檔分割，目前不需要

**選擇理由：** WebDAV 是 ownCloud/Nextcloud 的標準協定，穩定且文件完整。

### D2: 進度追蹤使用 axios onUploadProgress

```javascript
axios.put(url, data, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    // 顯示進度
  }
});
```

**替代方案：**
- 使用原生 XMLHttpRequest：較複雜
- 使用第三方進度庫：增加依賴

**選擇理由：** axios 已內建支援，無需額外依賴。

### D3: 指令格式

```bash
ssp upload <本地檔案> <遠端路徑>
```

範例：
```bash
ssp upload ./report.pdf /Documents/report.pdf
```

**選擇理由：** 簡潔直觀，符合 Unix 工具風格。

### D4: 進度顯示格式

```
上傳中... 65% (3.2 MB / 5.0 MB) @ 256 KB/s
```

每 5% 更新一次，單行更新（使用 `\r` 回車覆蓋）。

## Risks / Trade-offs

- **大檔記憶體使用**：目前使用完整檔案上傳，超大檔可能占用大量記憶體 → 未來可擴充 chunk 上傳
- **速度計算精度**：使用簡單的 bytes/time 計算，可能不夠精確 → 可接受的簡化
- **網路中斷**：不支援斷點續傳，中斷需重新上傳 → 目前可接受，未來可擴充
