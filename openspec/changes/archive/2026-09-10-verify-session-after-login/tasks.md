# Tasks: verify-session-after-login

## 1. 實作 — `src/client/sspClient.js`

- [x] 1.1 `login()`：在登入 POST 回 200 之後、`return { success, requesttoken, cookies }` 之前，以本次取得的 requesttoken + jar cookies 對 `/remote.php/webdav/` 發 `PROPFIND`（headers：`requesttoken`、`X-Requested-With: XMLHttpRequest`、`Depth: 0`）— verify: grep sspClient.js `login()` 內含 `PROPFIND` 且位於 `return` 之前
- [x] 1.2 驗證成功（2xx，含 207/204）→ 維持原回傳結構不變 — verify: 既有回傳 `{ success: true, requesttoken, cookies }` 格式未被破壞（讀碼確認）；單元測試「有效 session」案例通過
- [x] 1.3 驗證失敗（非 2xx，如 401/403）或請求本身 reject → `throw new Error("Login failed - Session verification failed")`（沿用 Client 層英文裸訊息慣例，不加 `Error: ` 前綴）— verify: `node --check` OK；單元測試「無效 session」案例斷言 throw 且錯誤訊息含 `Login failed - Session verification failed`
- [x] 1.4 確認驗證請求使用「本次登入」的 session（新 requesttoken + 新 cookies），而非既有 config 的舊憑證 — verify: 讀碼確認 PROPFIND 在 login POST 之後、由同一 `this.client`（jar 為本次登入後狀態）發送

## 2. 測試 — `test/login.test.js`（新增）

- [x] 2.1 新增測試檔，比照 `test/logout.test.js` 的 mock pattern（替換 `api.client.get/post/request` 為可控 handler）— verify: `test/login.test.js` 存在且沿用既有 mock 風格
- [x] 2.2 案例「有效 session」：mock GET login page 含 requesttoken、POST login 回 200、PROPFIND 回 2xx → `login()` 回傳 `{ success: true, ... }` 且 PROPFIND 請求確實送出（captured 數組含 `PROPFIND` + `/remote.php/webdav/`）— verify: 該測試 pass
- [x] 2.3 案例「無效 session」：mock GET/POST 成功、PROPFIND 回 401 → `login()` reject，錯誤訊息含 `Login failed - Session verification failed`；並驗證未呼叫 `configManager.save`（mock save 捕捉）— verify: 該測試 pass（斷言 reject + save 未被呼叫）
- [x] 2.4 案例「既有 config 保留」：預先寫入舊 config 檔 → 無效 session 登入 reject → 舊 config 內容未被覆寫 — verify: 該測試 pass（檔案內容與登入前一致）

## 3. Command 層行為確認（`src/commands/login.js`）

- [x] 3.1 確認 `login.js` 無程式碼變更：`configManager.save(...)` 位於 `api.login(...)` 成功之後（throw 時自然跳過 save、落入既有 catch `Error: ${err.message}` + exit 1）— verify: `git diff --stat` 顯示 login.js 未修改；讀碼確認控制流
- [x] 3.2 `node --check src/commands/login.js` 與 `node --check src/client/sspClient.js` 皆通過 — verify: 兩指令 exit 0

## 4. 整體驗證

- [x] 4.1 `npm test` 全綠（既有 36 測試 + 新增 login 測試）— verify: `npm test` exit 0 且 login tests 列於結果
- [x] 4.2 中文 runtime 字串檢查：grep `[\u4e00-\u9fff]` 於 `src/client/sspClient.js` 與 `src/commands/login.js` 的 runtime 字串 → 0 命中（註解除外） — verify: grep 結果僅命中註解或無命中
- [x] 4.3 假憑證冒煙（隔離 HOME）：以無效密碼執行 `ssp login -u <user> -p wrong` → 輸出 `Error: Login failed - Session verification failed`、exit 非 0、`~/.ssp-config.json` 不存在（或既有內容未被覆寫）— verify: 手動執行觀察輸出與 exit code，並檢查 config 檔狀態
- [x] 4.4 真憑證冒煙（隔離 HOME，用後清理）：正確憑證執行 `ssp login` → `Login successful! Credentials saved.`、config 存在且含 requesttoken/cookies；隨後 `ssp ls /` 成功（證明 session 真實可用）— verify: 手動執行；結束後刪除隔離 HOME `.ssp-config.json` 與暫存檔
- [x] 4.5 `openspec validate` 通過 — verify: `openspec validate` exit 0