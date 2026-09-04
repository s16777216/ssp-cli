## 1. package.json 設定更新

- [x] 1.1 將 `name` 改為 `@s16777216/ssp-cli`
- [x] 1.2 更新 `author` 為 `l1597532@gmail.com`
- [x] 1.3 將 `repository`/`bugs`/`homepage` 更新為真實網址 `https://github.com/s16777216/ssp-cli`（repository 用含 `type: git` 的物件形式）
- [x] 1.4 確認 `files` 清單（`src/`, `README.md`, `LICENSE`）與 `bin.ssp` 設定維持正確

## 2. 版本號統一

- [x] 2.1 在 `src/cli.js` 將 `program.version("1.0.0")` 改為 `program.version(require("../package.json").version)`
- [x] 2.2 驗證 `node src/cli.js --version` 輸出與 package.json 的 `0.1.0` 一致

## 3. LICENSE 與授權

- [x] 3.1 建立根目錄 `LICENSE` 檔（標準 MIT 全文，版權人 `l1597532@gmail.com`）

## 4. 測試結構搬移與框架升級

- [x] 4.1 將 `src/test.js` 移至 `test/sanity.js`（內容翻成 `node:test` 形式）
- [x] 4.2 新增 `test/upload.test.js`：以 mock `this.client.request` 驗證 `uploadFile()` 目錄目標（remotePath 結尾 `/` 時 URL 正確拼接 `path.basename(localPath)`），以及完整檔案路徑行為不變
- [x] 4.3 更新 `package.json` 的 `scripts.test` 為 `node --test`（Node 自動發現 `test/` 目錄）
- [x] 4.4 執行 `npm test` 確認所有測試通過（含 sanity 與 upload 單測）

## 5. README 更新

- [x] 5.1 更新 `README.md` 安裝段落為 `npm install -g @s16777216/ssp-cli`

## 6. 發佈前驗收

- [x] 6.1 執行 `npm pack --dry-run` 確認 tarball 內容：包含 `src/`、`README.md`、`LICENSE`，**不含** `test/` 及 `openspec/`
- [x] 6.2 本機執行 `npm install -g .` 後跑 `ssp --version`，確認 `ssp` 指令可用且版本與 package.json 一致
- [x] 6.3 對所有變更檔案執行語法驗證（`node --check`）確認無錯誤（LSP typescript server 未安裝，改以 Node 語法檢查替代）
