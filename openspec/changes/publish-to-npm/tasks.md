## 1. package.json 設定更新

- [ ] 1.1 將 `name` 改為 `@s16777216/ssp-cli`
- [ ] 1.2 更新 `author` 為 `l1597532@gmail.com`
- [ ] 1.3 將 `repository`/`bugs`/`homepage` 更新為真實網址 `https://github.com/s16777216/ssp-cli`（repository 用含 `type: git` 的物件形式）
- [ ] 1.4 確認 `files` 清單（`src/`, `README.md`, `LICENSE`）與 `bin.ssp` 設定維持正確

## 2. 版本號統一

- [ ] 2.1 在 `src/cli.js` 將 `program.version("1.0.0")` 改為 `program.version(require("../package.json").version)`
- [ ] 2.2 驗證 `node src/cli.js --version` 輸出與 package.json 的 `0.1.0` 一致

## 3. LICENSE 與授權

- [ ] 3.1 建立根目錄 `LICENSE` 檔（標準 MIT 全文，版權人 `l1597532@gmail.com`）

## 4. 測試結構搬移與框架升級

- [ ] 4.1 將 `src/test.js` 移至 `test/sanity.js`（內容翻成 `node:test` 形式）
- [ ] 4.2 新增 `test/upload.test.js`：以 mock `this.client.request` 驗證 `uploadFile()` 目錄目標（remotePath 結尾 `/` 時 URL 正確拼接 `path.basename(localPath)`），以及完整檔案路徑行為不變
- [ ] 4.3 更新 `package.json` 的 `scripts.test` 為 `node --test test/`
- [ ] 4.4 執行 `npm test` 確認所有測試通過（含 sanity 與 upload 單測）

## 5. README 更新

- [ ] 5.1 更新 `README.md` 安裝段落為 `npm install -g @s16777216/ssp-cli`

## 6. 發佈前驗收

- [ ] 6.1 執行 `npm pack --dry-run` 確認 tarball 內容：包含 `src/`、`README.md`、`LICENSE`，**不含** `test/` 及 `openspec/`
- [ ] 6.2 本機執行 `npm install -g .` 後跑 `ssp --version`，確認 `ssp` 指令可用且版本與 package.json 一致
- [ ] 6.3 對所有變更檔案執行 `lsp_diagnostics` 確認無錯誤
