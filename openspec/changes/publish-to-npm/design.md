## Context

ssp-cli 是 Node.js CLI 工具（操作 Mailcloud / SecuSharePro 雲端檔案儲存），目前只能以 `npm install -g .` 本機安裝。package.json 已具備 `bin`（`ssp` → `src/cli.js`）、`#!/usr/bin/env node` shebang、`prepublishOnly`、`files` whitelist 等發佈基礎，但存在多項阻礙實際發佈的問題：

- 裸名稱 `ssp-cli` 在 npm 已被其他用途套件佔用。
- `repository/bugs/homepage` 是假網址 `your-username/ssp-reverse`（實際 remote 為 `github.com/s16777216/ssp-cli`）。
- 缺少 `LICENSE` 檔（`files` 與 package.json 均宣告 MIT 但檔案不存在）。
- `src/cli.js` 內 `program.version("1.0.0")` 硬編碼，與 package.json 的 `0.1.0` 不一致。
- 測試檔 `src/test.js` 位於 `src/` 內，會被包進發佈 tarball。

## Goals / Non-Goals

**Goals:**
- 使 ssp-cli 能以 `@s16777216/ssp-cli` 名稱透過 `npm install -g` 安裝、`ssp` 指令可用。
- 統一版本號權威來源為 package.json。
- 建立 MIT LICENSE 檔並同步 author。
- 修正 repository URL 為真實 GitHub 網址。
- 將測試檔移出 `src/`，確保不進 tarball。
- 升級測試框架至 Node 內建 `node:test`，並固化 uploadFile 目錄目標行為為單元測試。
- 更新 README 安裝說明。

**Non-Goals:**
- 不實際執行 `npm publish`（發佈留待 change 完成後手動執行，涉及 npm 憑證與兩步驟驗證）。
- 不使用 `.npmignore`（因 `files` whitelist 存在時對 whitelist 內檔案無效）。
- 不新增執行期（runtime）依賴。
- 不引入第三方測試框架（`node:test` 已滿足）。
- 不變更 `uploadFile()` 本身的執行邏輯（僅補測試）。

## Decisions

**Decision 1：採用 scoped 名稱 `@s16777216/ssp-cli`**

裸名稱 `ssp-cli` 已被 npm 上其他用途的套件佔用，無法直接發佈。改用 scoped 名稱，以 npm 帳號（=GitHub 帳號 `s16777216`）作為 scope，與 GitHub repo 一致。
- **替代方案**：換一個新裸名稱（如 `ssp-mailcloud`）——需重新選品牌，且 scope 名稱與既有 repo/帳號完全對應更簡潔。
- **採用理由**：名稱衝突最小、與 GitHub 帳號一致、利於未來遷回 private。

**Decision 2：版本號以 package.json 為唯一權威來源**

`src/cli.js` 改為 `program.version(require("../package.json").version)`，消除硬編碼 `1.0.0` 與 `0.1.0` 的分叉。首次發佈版本維持 `0.1.0`。
- **採用理由**：單一來源，永不 drift；`--version` 與實際發佈版本永遠一致。

**Decision 3：測試檔移出 `src/` 至 `test/sanity.js`**

因 `files: ["src/", "README.md", "LICENSE"]` 是 whitelist，`.npmignore` 對 whitelist 內檔案無效，無法用 `.npmignore` 排除單一測試檔。將測試檔移到 `src/` 外的 `test/` 目錄，是讓測試「保留在 repo 但不進 tarball」最乾淨的方式。
- **替代方案**：`.npmignore` 排除 `src/test.js`——無效（whitelist 語意）。
- **採用理由**：whitelist 機制下唯一乾淨解，且 `test/` 目錄結構利於未來擴充多測試檔。

**Decision 4：改用 Node 內建 `node:test` + `node:assert`**

專案引擎要求 Node >=18，`node:test` 為內建模組、零依賴。`npm test` 改為 `node --test test/`，`prepublishOnly` 維持 `npm test`（跑完整測試，含 upload 單測）作為發佈品質閘門。
- **替代方案**：維持手寫 runner（`node src/test.js`）——結構較差、報表不明確。
- **採用理由**：零新依賴、內建於 Node、可發現測試檔案、報表清楚。

**Decision 5：upload 單元測試以 mock `this.client.request` 驗證 URL 拼接**

新的 `test/upload.test.js` 測試 `uploadFile()` 的目錄目標行為：覆寫實例的 `this.client.request`，攔截呼叫並斷言 WebDAV PUT 的 URL。需注意 `uploadFile` 在讀檔前會先 `fs.existsSync`/`fs.statSync`，測試須提供真實存在的本機暫存檔。
- **替代方案**：`axios-mock-adapter`（需新增 devDependency）、重構抽出純函式（動到程式結構）。
- **採用理由**：最輕量、零新依賴、聚焦驗證核心行為（`remotePath` 結尾 `/` 時 URL 正確拼接 `path.basename(localPath)`）。

**Decision 6：LICENSE 為 MIT，版權人 `l1597532@gmail.com`，並同步 author**

建立根目錄 `LICENSE` 檔（標準 MIT 全文），並將 `package.json` 的 `author` 同步為 `l1597532@gmail.com`，保持授權與套件元資料一致。

**Decision 7：repository/bugs/homepage 更新為真實網址**

三個欄位均改為 `https://github.com/s16777216/ssp-cli`（repository 用物件形式含 `type: git`）。

## Risks / Trade-offs

- **[風險] scoped 公開套件需 `--access public` 才能公開發佈** → 本 change 不實際 publish，但 design/README 會註明；實際發佈時使用 `npm publish --access public`（或先在 npm 將套件設為 public）。
- **[風險] `npm install -g .` 驗收需在未與已安裝全域套件衝突的環境進行** → 驗收以 `npm pack --dry-run` 檢查內容 + `npm install -g .` 後 `ssp --version` 驗證執行，若環境有舊版 `ssp` 需先解除安裝。
- **[風險] 改名為 scoped 後，既有以 `ssp-cli` 名義的本地引用失效** → 本專案 CLI 以 `ssp` bin 名安裝，不受 package name 改變影響；此為新套件，無下游相依。
- **[風險] `node:test` 的 `node --test test/` 在 Node 18 早期版本的目錄遞迴行為** → Node 18 支援 `test/` 目錄掃描（含子目錄）；測試檔位於 `test/` 根層，無巢狀疑慮。

## Migration Plan

- 無資料庫或持久化狀態變更，無需遷移。
- 部署即更新 package.json / cli.js / 測試結構 / README / LICENSE。
- 回滾：還原 package.json（name、author、URL）、cli.js 版本號、測試檔位置即可，無副作用。
- 實際發佈為 change 完成後的**手動**步驟：`npm login` → `npm publish --access public`。
