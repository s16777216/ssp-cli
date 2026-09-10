## Context

See proposal.md — Why. 現況：`SSPClient.login()`（sspClient.js L17-49）在登入 POST 回 200 後直接回傳 `{ success, requesttoken, cookies }`，完全沒有檢查 session 是否真實可用。已知伺服器（ownCloud 系）對錯誤密碼的登入 POST 也可能回 200（body 帶 redirect/失敗資訊），導致 CLI 誤存無效憑證、後續指令全以 401 失敗。`sspApi`（SSPSpi）繼承自 `SSPClient`，`login.js` 直接呼叫 `api.login()`。

約束（unify-error-messages 已確立）：錯誤訊息一律英文裸訊息於 Client/API 層，`Error: ` 前綴只由 command 層加一次；`login.js` catch 已是 `console.error(\`Error: ${err.message}\`)`（L23），只要 `login()` throw 即可獲得正確輸出格式。

## Goals / Non-Goals

**Goals:**
- 登入 POST 回 200 後，立即以「本次登入取得」的 requesttoken + cookies 對 `/remote.php/webdav/`（Depth: 0）發 PROPFIND。
- 2xx → 視為有效 session，回傳 credentials；非 2xx 或請求異常 → throw，login.js 不存 config（落在既有 catch → `Error: <message>` + exit 1）。
- 不覆寫既有有效 config（throw 發生在 `configManager.save` 之前，既有檔案自然保留）。

**Non-Goals:**
- 不改變登入流程的既有回傳結構、不重構 `SSPClient`/`SSPSpi` 其他方法。
- 不處理「config 已存在但 session 過期」的重新驗證（那是既有行為，非本 change 範圍）。
- 不改 `login.js` 的顯示文案與 catch 邏輯。

## Decisions

**D1：驗證位置 — 放 `SSPClient.login()` 內（POST 之後、return 之前）**
- 理由：session 驗證是「登入成功」定義的一部分，Client 層保證「回傳的 credentials 一定可用」，所有呼叫端（login.js 與未來其他端點）自動獲得正確行為；`login.js` 零更動。
- 替代方案 A：放 `login.js` command 層 — 會讓 command 重複 try/catch、且其他程式化呼叫端（test/scripts）得不到保證。否決。
- 替代方案 B：新增獨立的 `verifySession()` 方法由 `login()` 內部呼叫 — 語意較清晰、可單獨測試；但 SPIS 的 `request()` helper（sspClient.js L69）會自動帶 requesttoken + X-Requested-With，正好符合驗證請求需求，直接呼叫即可，不需額外方法。採「inline 於 login()」＋以既有 `this.client.request` 手動 PROPFIND（帶 cookies：axios-cookiejar-support 的 jar 已在 login POST 後持有本次 session cookies）。

**D2：驗證端點 — `PROPFIND /remote.php/webdav/`（Depth 0）**
- 理由：WebDAV 根目錄是受保護資源，未授權一律 401；Depth 0 只查根、不列內容，成本最低（不需帶有權限的 dir 變數、不依賴 list.php 的 AJAX body 解析）；與既有 `rm.js`/探針已驗證的 PROPFIND 行為一致。
- 替代方案：`GET /index.php/apps/files/ajax/list.php?dir=/` — 也能驗證但回 body 較大且依賴 AJAX endpoint 的 body 結構；PROPFIND 的 2xx/4xx 語意更直接。採 PROPFIND。

**D3：throw 的錯誤訊息 — 英文裸訊息，沿用既有慣例**
- `Login failed - Session verification failed`（非 2xx）／保留伺服器/axios 原始訊息於 `err.message` 作為附加內容。
- 格式對齊 `login.js` 既有輸出瀏覽：最終 CLI 顯示 `Error: Login failed - ...`，單一 `Error: ` 前綴（command 層加），符合 unify-error-messages 規範。

**D4：axios 錯誤處理 — 捕獲驗證請求的 throw，轉為單一 Error**
- `this.client.request` 對非 2xx 會 reject（無自訂 validateStatus），因此 PROPFIND 401/403 自然 throw；catch 後 `throw new Error("Login failed - Session verification failed")`（必要時附 `cause`/`err.message`）即可。避免讓 axios 原始堆疊直接洩漏。

## Risks / Trade-offs

- [額外 1 個 PROPFIND 請求/登入] → 可忽略的延遲；Depth 0 只查根目錄，body 極小。
- [伺服器對 PROPFIND 回非標準 2xx（如 207 Multi-Status）] → 207 屬 2xx，axios 預設視為成功，不影響；若伺服器對「有效但空根」回 204 亦為 2xx，通過。
- [既有測試可能 mock 掉 `login()` 造成此邏輯未覆蓋] → 新增針對 `login()` 內驗證的單元測試（mock `this.client.request` 回 401 → 斷言 throw、credentials 未回傳）。
- [真實伺服器上驗證 PROPFIND 若被 WAF/閘道攔截回非 2xx] → 視為登入失敗（安全側偏誤：寧可不存 config，也不存無效 session）；若實測證實誤判可再調整。