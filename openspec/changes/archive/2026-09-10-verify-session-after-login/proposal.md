## Why

目前 `ssp login` 只檢查登入 POST 是否回傳 HTTP 200 就儲存 config；但伺服器對錯誤密碼或假登入也會回 200（如 `{"status":"success","redirect":"..."}` 或失敗 body），導致 CLI 顯示 `Login successful!`、寫入無效的 requesttoken/cookies。之後所有指令（如 mkdir）都以 401 失敗，使用者被誤導「已登入」。登入流程缺少「session 真實可用」的驗證步驟。

## What Changes

- `SSPClient.login()`：登入 POST 成功後，立即以取得的 session（requesttoken + cookies）對受保護的 WebDAV 端點執行 `PROPFIND /remote.php/webdav/`（Depth 0）驗證 session 真實有效。
  - 驗證成功（2xx）：維持回傳 `{ success: true, requesttoken, cookies }`。
  - 驗證失敗（401/403/其他非 2xx 或無法解析）：throw `Error`，**不回傳** credentials → `login.js` 的 `configManager.save(...)` 不會執行 → 不會寫入無效 config。
- `src/commands/login.js`：無邏輯變更（throw 後自然落入既有的 catch → `Error: <message>` + exit 1，且 **不** 顯示 `Login successful!`）。僅確認行為符合預期。
- 錯誤訊息統一為英文裸訊息（遵循既有的 API/Client 層慣例，`Error: ` 前綴僅由 command 層添加一次）。
- 新增 fake-session 驗證測試：模擬登入 POST 200 但 session 驗證失敗 → login throw、config 未保存。

## Capabilities

### New Capabilities

- `auth-login`: 使用者登入 Mailcloud 並在儲存憑證前確認 session 真實有效；無效 session 不得被持久化。

### Modified Capabilities

- 無（現有 `auth-logout` 的行為不受影響）。

## Impact

- `src/client/sspClient.js` — `login()` 方法新增 session 驗證步驟（唯一實作變更）。
- `src/commands/login.js` — 僅驗證行為，無程式碼變更（若驗證失敗不得顯示成功訊息）。
- `test/` — 新增 login session 驗證的單元測試；既有測試（含 `test/sanity.js` 的 login 相關）需保持通過。
- 執行時間成本：每次登入多 1 個 PROPFIND 請求（可忽略）。