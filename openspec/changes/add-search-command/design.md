## Context

node-ssp-cli 目前支援 `ls` 列出指定目錄的檔案，但缺少搜尋功能。使用者需要在 Mailcloud (ownCloud) 上搜尋檔案。

現有架構：
- `sspClient.js`：核心 HTTP Client
- `sspApi.js`：API 方法
- `cli.js`：CLI 入口

## Goals / Non-Goals

**Goals:**

- 新增 `ssp search <keyword>` 指令
- 使用 AJAX 搜尋端點：`GET /index.php/apps/files/ajax/search.php?search=<keyword>`
- 預設搜尋檔名，支援 `-c` 搜尋內容
- 支援 `-t` 限定類型，`--json` 輸出 JSON
- 預設輸出表格格式（同 `ls` 風格）

**Non-Goals:**

- 不支援正則表達式搜尋
- 不支援複雜查詢（如日期範圍、大小範圍）
- 不支援跨所有儲存空間搜尋（限當前掛載點）

## Decisions

### D1: 使用 AJAX 搜尋端點

ownCloud 的搜尋功能透過 AJAX 端點：

```
GET /index.php/apps/files/ajax/search.php?search=<keyword>
Headers: requesttoken, X-Requested-With
```

回傳 JSON 格式的檔案列表，包含檔案資訊。

**替代方案：**
- WebDAV REPORT (DAV:searchrequest)：標準但複雜，ownCloud 支援有限

**選擇理由：** AJAX 端點較簡單，回傳格式固定，ownCloud 完整支援。

### D2: 搜尋範圍

| 旗標 | 範圍 |
|------|------|
| 預設 | 檔名搜尋 |
| `-c` / `--content` | 檔案內容搜尋（需伺服器支援全文索引） |

**選擇理由：** 預設檔名搜尋速度較快，內容搜尋需伺服器端建立全文索引。

### D3: 類型篩選

```bash
ssp search report
ssp search -t file report
ssp search -t dir report
ssp search -t all report
```

### D4: 輸出格式

| 旗標 | 輸出 |
|------|------|
| 預設 | 表格（同 `ls` 風格，含名稱、大小、日期、權限、擁有者） |
| `--json` | JSON 陣列 |

### D5: 指令格式

```bash
ssp search <keyword>
ssp search -c <keyword>
ssp search -t file <keyword>
ssp search --json <keyword>
```

## Risks / Trade-offs

- **內容搜尋需全文索引**：若伺服器未建立索引，`-c` 可能無結果或極慢
- **搜尋範圍限制**：AJAX 搜尋通常限於當前使用者可見範圍
- **大量結果效能**：大量結果需分頁，目前一次性回傳
- **中文搜尋**：URL 編碼需正確處理