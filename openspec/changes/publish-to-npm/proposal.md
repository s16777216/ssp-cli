## Why

目前 ssp-cli 只能透過 `npm install -g .`（本機路徑）安裝，外部使用者無法直接從 npm registry 安裝。裸名稱 `ssp-cli` 已在 npm 被其他用途套件佔用，無法以該名稱公開發佈。此外 package.json 的 repository URL 是假網址、缺少 LICENSE 檔、版本號不一致（cli.js 硬編碼 `1.0.0` 與 package.json 的 `0.1.0` 不符），且測試檔 `src/test.js` 會被包進發佈的 tarball。這些都阻礙 `ssp` 成為一個可正常透過 npm 安裝、發佈的 CLI 套件。

## What Changes

- 將套件命名改為 scoped 名稱 `@s16777216/ssp-cli`，解決裸名稱衝突，使使用者可 `npm install -g @s16777216/ssp-cli` 安裝。
- 使 `src/cli.js` 的版本號改讀 `package.json`（`require("../package.json").version`），消除版本不一致。
- 建立缺失的 `LICENSE` 檔（MIT，版權人 `l1597532@gmail.com`），並同步 `package.json` 的 `author` 欄位為 `l1597532@gmail.com`。
- 將 `repository`/`bugs`/`homepage` 欄位更新為真實 GitHub 網址 `https://github.com/s16777216/ssp-cli`。
- 將測試檔 `src/test.js` 移出 `src/` 至 `test/sanity.js`，避免測試檔被包進發佈 tarball。
- 改用 Node 內建 `node:test` + `node:assert` 作為測試框架，測試指令改為 `node --test test/`。
- 新增 `uploadFile()` 目錄目標的單元測試（mock `this.client.request`），將先前 `fix-upload-directory` 僅手動驗證的行為固化為自動化測試。
- `prepublishOnly` 維持 `npm test`，跑完整 `test/` 目錄（含 upload 單測）作為發佈前品質閘門。
- 更新 `README.md` 安裝段落為 `npm install -g @s16777216/ssp-cli`。
- **不含**實際 `npm publish`（發佈留待 change 完成後手動執行，涉及 npm 憑證）。

## Capabilities

### New Capabilities
- `npm-publish`: 定義 ssp-cli 作為可透過 npm registry 發佈與安裝的套件所需具備的包裝、命名、授權與內容條件。

### Modified Capabilities
<!-- 無既有 capability 的需求需要修改 -->

## Impact

- **程式碼**：`src/cli.js`（版本號讀取）、測試檔案位置與框架（`src/test.js` → `test/sanity.js`）、新增 `test/upload.test.js`。
- **設定**：`package.json`（name、author、repository/bugs/homepage、lint? 無；scripts.test）。
- **文件**：`README.md`（安裝段落）、新增 `LICENSE` 檔。
- **介面**：安裝方式由 `npm install -g .` 改為 `npm install -g @s16777216/ssp-cli`。
- **無**：不實際 publish、不新增執行期依賴、不使用 `.npmignore`（因 `files` whitelist 已存在）。
