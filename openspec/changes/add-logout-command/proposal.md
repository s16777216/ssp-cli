## Why

目前 node-ssp-cli 支援 `login` 指令登入並儲存憑證，但缺少登出功能。使用者需要清除本地儲存的憑證、Cookie、Token，並可選擇性地撤銷伺服器端的 session。

## What Changes

- 新增 `logout` 指令，清除本地儲存的憑證（`~/.ssp-config.json`）
- 支援 `--all` 旗標：同時呼叫伺服器 `/index.php/logout` 撤銷伺服器端 session
- 預設僅清除本地憑證，不影響伺服器端 session

## Capabilities

### New Capabilities

- `auth-logout`: 登出並清除憑證

### Modified Capabilities

（無）

## Impact

- 新增 `src/commands/logout.js` 指令模組
- 需擴充 `configManager.js` 新增 `clear()` 方法
- 可選：依賴伺服器端點 `/index.php/logout`
- 無新增相依套件