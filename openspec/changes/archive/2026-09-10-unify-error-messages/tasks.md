# Tasks: unify-error-messages

## 1. API 層 — src/client/sspApi.js

- [x] 1.1 uploadFile：L66 `錯誤: 檔案不存在 - ${localPath}` 改裸英文 `File not found - ${localPath}` — verify: grep L66 無 `錯誤` 且無 `Error: ` 前綴
- [x] 1.2 createFolder：L258 405 改回 `{ status: 'exists' }`（不帶 data.message）、L261 409 → `Parent directory not found`、L264 403 → `Permission denied` — verify: 單層模式 mkdir 已存在資料夾時 mkdir.js 依 exists branch 顯示 `Error: Folder already exists - <path>` 且 exit 1
- [x] 1.3 createFolder recursion：L283 `message.includes('已存在')` 語言耦合改 `result.status === 'error'`（'exists' 繼續、其餘 error 中止）— verify: `ssp mkdir -p` 中間/最終 segment 已存在 → 靜默成功；409/403 真實錯誤仍中止回報
- [x] 1.4 copyFile：L326/332/338/344 → `Destination already exists - ${normalizedDst}` / `Source not found - ${normalizedSrc}` / `Permission denied` / `Copy failed - HTTP ${response.status}`（全裸英文、保留 status 412→'exists'）— verify: 各訊息字串符合上述、無前綴
- [x] 1.5 statPath：L382/388 → `Source not found - ${normalized}` / `Failed to get source info - HTTP ${response.status}`（保留 code: 404）— verify: cp/mv 來源不存在輸出 `Error: Source not found`（單一前綴）
- [x] 1.6 moveFile：L549/555/561/568/574 去掉既有 `Error: ` 前綴 → `Destination already exists - ${normalizedDst}` / `Source not found - ${normalizedSrc}` / `Permission denied` / `Cross-storage move not supported, use cp + rm instead` / `Move failed - HTTP ${response.status}` — verify: mv.js L31/69/77 之 `Error: ${...}` wrap 不再雙重前綴
- [x] 1.7 searchFiles：L513 `搜尋端點不可用` → `Search endpoint unavailable` — verify: 全端點失敗時輸出 `Error: Search endpoint unavailable`
- [x] 1.8 整層驗證：grep runtime message 字串無中文字元、無 `Error: ` 前綴殘留（程式註解維持中文，不算）— verify: `grep -n "錯誤" src/client/sspApi.js` 僅命中註解

## 2. Command 層 — 共用格式

- [x] 2.1 登入提示加 `Error: ` 前綴：upload/cp/download/mkdir/mv/rm/search/ls 共 8 檔的 `"Please login first using: ssp login -u <user> -p <pass>"` → 前置 `Error: ` — verify: grep `Please login first` 於 src/commands → 8 命中且皆含前綴
- [x] 2.2 catch 統一為 `console.error(\`Error: ${err.message}\`)`：取代逗號形式 `console.error("Error:", err.message)`（upload/download/cp/mv/mkdir/rm/ls）、`console.error("錯誤:", err.message)`（search）、`console.error("Login failed:", ...)`（login）—— 共 9 檔 — verify: grep `"Error:"` 逗號形式、`"錯誤:"`、`"Login failed:"` 於 src/commands → 0 命中

## 3. Command 層 — 個別指令訊息

- [x] 3.1 upload.js：`上傳中...` → `Uploading...`（L36、L46 進度列，去掉重複的 `上傳中...` 前綴）、`上傳完成: ${remotePath}` → `Upload complete: ${remotePath}`（L55）、`錯誤: 上傳失敗 - ` → `Error: Upload failed - `（L57）、L32 `錯誤: 檔案不存在` → `Error: File not found - ${localFile}` — verify: `ssp upload` 成功/失敗/檔案不存在三路輸出全英文
- [x] 3.2 download.js：`下載中...` → `Downloading...`（L45、L55）、`下載完成: ${localPath}` → `Download complete: ${localPath}`（L67）、`錯誤: 下載失敗 - ` → `Error: Download failed - `（L88，保留既有 errorMsg 解析邏輯）— verify: 成功進度列與完成訊息為英文
- [x] 3.3 cp.js：L32/L80 `錯誤: ${...}` → `Error: ${...}`、L40 `錯誤: 來源為資料夾，請使用 -r` → `Error: Source is a folder, use -r`、L62 prompt → `Destination already exists, overwrite? [y/N] `、L70 `已取消複製` → `Copy cancelled`、L77 `複製完成: ${dst}` → `Copy complete: ${dst}` — verify: 覆蓋 prompt 與完成/取消輸出英文
- [x] 3.4 mv.js：L53 prompt → `Destination already exists, overwrite? [y/N] `、L61 `已取消移動` → `Move cancelled`、L74 `移動完成: ${dst}` → `Move complete: ${dst}`（L31/69/77 因 API 去前綴自動修正，勿動）— verify: `ssp mv` 目標已存在/成功/取消三路輸出英文且無雙重前綴
- [x] 3.5 mkdir.js：L29 `建立資料夾: ${remotePath}` → `Creating folder: ${remotePath}`、L36 `建立完成: ${remotePath}` → `Folder created: ${remotePath}`、else 分支改：`exists` → `Error: Folder already exists - ${remotePath}`（exit 1）、`error` → `Error: ${message || "Unknown error"}`（exit 1）— verify: 單層已存在 exit 1、成功 exit 0、`-p` 已存在 exit 0（與現行為一致）
- [x] 3.6 rm.js：L47 prompt → `Delete ${remotePath}? [y/N] `、L50/65 `刪除中...` → `Deleting...`、L53/68 `刪除完成: ${remotePath}` → `Delete complete: ${remotePath}`、L56/71 `錯誤: 刪除失敗 -` → `Error: Delete failed -`、L61 `已取消刪除` → `Deletion cancelled`（L36 `Invalid remote path` 已合規勿動）— verify: 確認 prompt/完成/刪除失敗輸出英文
- [x] 3.7 search.js：L40 `錯誤: 無效的類型 "${options.type}"，可用選項: ${validTypes.join(', ')}` → `Error: Invalid type "${options.type}", available options: ${validTypes.join(', ')}`、L62/90 `無符合結果` → `No matching results`、L93 `錯誤: ${...}` → `Error: ${...}` — verify: `ssp search -t bogus kw` 與空結果輸出英文
- [x] 3.8 logout.js：L17/41 `已登出` → `Logged out`、L39 `已登出 (含伺服器 session)` → `Logged out (including server session)`、L31 `警告: 伺服器登出失敗，但本地憑證已清除` → `Warning: Server logout failed, local credentials cleared`（L44 catch 已 template 形式勿動）— verify: `ssp logout` 三狀況輸出英文

## 4. 測試、文件與整體驗證

- [x] 4.1 test/search.test.js L118 mock `伺服器錯誤` → `Server error` — verify: `npm test` 通過
- [x] 4.2 README 引用的 CLI 輸出字串改英文對應（進度格式 `上傳中... 65% ...` 等；說明文體維持中文）— verify: grep `上傳中|下載中|已登出` 於 README → 0 命中
- [x] 4.3 整體驗證：`npm test` 全綠；grep `[\u4e00-\u9fff]` 於 src/commands 與 src/client 的 runtime 字串 → 0 命中（註解除外）；逐指令手動冒煙測試輸出全英文
- [x] 4.4 spec 漂移紀錄：確認 `file-move` 的 `目標目錄不存在` 情境無對應實作（mv 目標父目錄不存在 → 伺服器 409 → moveFile 判為 cross-fs → 顯示 `Error: Cross-storage move not supported, use cp + rm instead`）；於本 change 註記此發現，**不新增行為** — verify: 執行上述指令確認輸出，並於驗證時標註 drift 已記錄

> **冒煙測試發現（2026-09-10）**：`createFolder` 原本在 catch 中處理 405/409/403，但其 `validateStatus: (status) => status < 500` 使 axios 對這些 4xx **不會 throw** → catch 分支全是死碼 → 未授權（401）/已存在（405）時誤報 `success`。已修正為比照 copyFile/moveFile/statPath 的 pattern（axios 不 throw、改檢查 `response.status`）：405→`exists`、409→`Parent directory not found`、403→`Permission denied`、其餘 4xx→`Create folder failed - HTTP <status>`。此修正讓 task 1.2/3.5 的 verify（已存在資料夾 → `Error: Folder already exists` + exit 1）真正成立。驗證：`node --check` OK、`npm test` 36/36 pass、fake-session mkdir → `Error: Create folder failed - HTTP 401` + exit 1。

> **rm 資料夾刪除邊角調查結論（2026-09-10）**：`deleteFile` 的 WebDAV DELETE URL 只用 `cleanFilename`（sspApi.js L16-17，`/remote.php/webdav/${webdavPath}`）**不含 dir 前綴** → 巢狀路徑（dir≠`/`）恆 404 → 落入 AJAX delete.php fallback（L31-45，僅限純 ASCII 無 `()`/空格檔名）。實測四案例：①根層級含子目錄之資料夾：URL 正確但伺服器偶發「執行刪除卻回非 2xx」→ CLI 顯示 `Error: Delete failed - '<name>' does not exist.` 但資料夾**已刪除**（測試 1、清理探針兩次重現）；②巢狀 + 曾上傳/刪除檔案（trashbin 狀態）：AJAX fallback 回無 `data` 的 error → `Error: Delete failed - Unknown error` 且資料夾**未刪除**（repro 重現）；③巢狀純子目錄、④raw WebDAV DELETE（正確巢狀路徑，204）：皆成功。結論：**錯誤訊息格式本身符合本 change 規範**（`Error: Delete failed - <msg>` 單一前綴）；失敗根因是既有 `deleteFile` dir 缺失 bug + 伺服器端偶發狀態（trashbin/非 2xx），**超出本 change 範圍，不新增行為**，另記於 spec drift 待後續 change 處理。