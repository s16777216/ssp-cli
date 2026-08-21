## Context

node-ssp-cli 目前支援 `login` 指令登入並將憑證、Cookie、Token 儲存至 `~/.ssp-config.json`。需要新增登出功能清除本地憑證，並可選擇性撤銷伺服器端 session。

現有架構：
- `configManager.js`：管理 `~/.ssp-config.json` 讀寫
- `sspApi.js`：API 方法，持有 `requesttoken` 和 `axios` client
- `cli.js`：CLI 入口

## Goals / Non-Goals

**Goals:**

- 新增 `ssp logout` 指令，清除本地 `~/.ssp-config.json`
- 支援 `--all` 旗標：同時呼叫伺服器 `/index.php/logout` 撤銷 session
- 預設僅清除本地，不影響伺服器端 session

**Non-Goals:**

- 不支援多帳號管理（未來擴充）
- 不支援登出所有裝置（需伺服器 API 支援）

## Decisions

### D1: 本地清除優先

| 操作 | 行為 |
|------|------|
| `logout` | 刪除 `~/.ssp-config.json`，顯示 `已登出` |
| `logout --all` | 先呼叫伺服器登出 API，再清除本地檔案 |

**選擇理由：** 預設安全（不影響伺服器端其他裝置的 session），`--all` 明確表示要撤銷 session。

### D2: 伺服器端登出 API

```
POST /index.php/logout
Headers: requesttoken, X-Requested-With
```

成功回傳 200/204，失敗不阻擋本地清除。

### D3: 指令格式

```bash
ssp logout
ssp logout --all
```

## Risks / Trade-offs

- **本地檔案不存在**：`logout` 仍顯示 `已登出`（冪等）
- **伺服器登出失敗**：`--all` 時伺服器 API 失敗不阻擋本地清除，只顯示警告
- **多帳號**：目前單帳號設計，未來擴充需支援 `--account`