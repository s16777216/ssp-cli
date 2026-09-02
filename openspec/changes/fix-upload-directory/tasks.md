## 1. 修正 uploadFile 目標路徑解析

- [ ] 1.1 在 `src/client/sspApi.js` 的 `uploadFile()` 中，以 `isDirectoryTarget = normalizedRemotePath.endsWith('/')` 判斷目標是否為目錄
- [ ] 1.2 當目標為目錄時，以 `targetPath = ${normalizedRemotePath}${path.basename(localPath)}` 拼接本機檔名；否則維持原始路徑
- [ ] 1.3 將 WebDAV PUT 的 URL 改用 `targetPath`，並移除錯誤的 `filename = path.basename(remotePath)` 變數

## 2. 驗證修正

- [ ] 2.1 以完整檔案路徑上傳（`ssp upload ./file.txt /remote.txt`）確認行為不變、仍可正常上傳
- [ ] 2.2 以目錄路徑上傳（`ssp upload ./file.txt /dir/`）確認檔案成功置入目錄內、保留原檔名
- [ ] 2.3 對 `src/client/sspApi.js` 執行 `lsp_diagnostics` 確認無錯誤

## 3. 文件同步修正

- [ ] 3.1 修正 `README.md` 中 `ls` 指令用法範例（`ssp ls /` → `ssp ls -d /`），使其符合實際 CLI 介面
