## Context

node-ssp-cli 目前支援 login 和 list 指令。需要新增 delete 功能讓使用者可以刪除 Mailcloud (ownCloud) 上的檔案。

現有架構：
- `sspClient.js`：核心 HTTP Client，處理登入、Cookie、CSRF Token
- `sspApi.js`：API 方法（目前已有 `deleteFile()` 方法）
- `cli.js`：CLI 入口，使用 commander

## Goals / Non-Goals

**Goals:**

- 新增 `ssp delete <完整路徑>` 指令
- 刪除前顯示確認提示 `[y/N]`，預設不刪除
- 顯示錯誤訊息並結束程式（如檔案不存在）

**Non-Goals:**

- 不支援批次刪除（未來擴充）
- 不支援垃圾筒功能（直接永久刪除）
- 不支援還原已刪除檔案

## Decisions

### D1: 使用 AJAX API 刪除

ownCloud 的標準刪除方式是透過 AJAX API：

```
POST /index.php/apps/files/ajax/delete.php
Body: dir=/Documents&files=["report.pdf"]
```

**替代方案：**
- WebDAV DELETE：較底層，需要更多設定

**選擇理由：** AJAX API 較簡單，已有實作（`sspApi.js` 的 `deleteFile()` 方法）。

### D2: 使用 readline 做確認提示

```javascript
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('確認刪除 /Documents/report.pdf? [y/N] ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    // 執行刪除
  }
  rl.close();
});
```

**替代方案：**
- 使用 `confirm` 套件：增加依賴
- 使用 `--force` 參數跳過確認：目前不需要

**選擇理由：** Node.js 內建 readline，無需額外依賴。

### D3: 指令格式

```bash
ssp delete <完整路徑>
```

範例：
```bash
ssp delete /Documents/report.pdf
```

**選擇理由：** 簡潔直觀，路徑明確。

### D4: 確認提示格式

```
確認刪除 /Documents/report.pdf? [y/N]
```

預設為 `N`（不刪除），需要明確輸入 `y` 才執行。

**選擇理由：** 安全考量，避免誤刪。

## Risks / Trade-offs

- **永久刪除**：刪除後無法還原，需謹慎使用 → 確認提示可降低風險
- **權限不足**：若無刪除權限會顯示錯誤 → 可接受，由伺服器端回報
- **路徑錯誤**：若路徑錯誤會顯示「檔案不存在」→ 可接受的錯誤處理
