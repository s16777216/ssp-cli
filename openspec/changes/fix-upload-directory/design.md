## Context

`src/client/sspApi.js` 的 `uploadFile()` 方法負責以 WebDAV PUT 上傳檔案。目前實作（第 72 行）雖然計算了 `const filename = path.basename(remotePath)`，但第 78 行的 URL 建構 `const url = /remote.php/webdav${normalizedRemotePath}` 直接使用原始 `remotePath`，完全沒有使用 `filename` 變數。

因此當使用者在 CLI 執行 `ssp upload ./local.pdf /Docs/`（目標結尾帶 `/`，代表上傳到目錄）時，實際會對目錄本身發送 PUT request，伺服器回傳 `PUT is not allowed on non-files`（Sabre\DAV\Exception\Conflict）。

README 說明文件明確記載「`ssp upload ./local.pdf /Docs/` # 上傳到目錄」為支援用法，但實作並未對應，形成文件與行為不一致。

## Goals / Non-Goals

**Goals:**
- 當 `remotePath` 結尾為 `/`（代表目錄目標）時，自動將本機檔名 `path.basename(localPath)` 拼接至目錄路徑，使 `ssp upload <local-file> <dir/>` 可正常運作。
- 保持現有行為不變：當使用者指定完整檔案路徑（`ssp upload ./file.txt /remote.txt`）時，上傳目標維持原始路徑。
- 採用最小變更，僅修改目標路徑解析邏輯，不觸及上傳流程、進度顯示等其他部分。

**Non-Goals:**
- 不在本 change 中新增「上傳到目錄前先確認/建立目錄」的行為。
- 不調整 WebDAV PUT 協定流程本身。
- 不處理其他指令（login/ls/mkdir/download/rm）的功能。

## Decisions

**Decision 1：以 `remotePath` 是否以 `/` 結尾判斷是否為目錄目標**

`remotePath` 結尾為 `/`（如 `/Docs/`、`/`）即視為目錄目標，此時將本機檔名拼接上去：

```javascript
// 判斷是否為目錄目標（結尾含 / 或 / 根目錄）
const isDirectoryTarget = normalizedRemotePath.endsWith('/');
const targetPath = isDirectoryTarget
  ? `${normalizedRemotePath}${path.basename(localPath)}`
  : normalizedRemotePath;
const url = `/remote.php/webdav${targetPath}`;
```

- **替代方案考量**：
  - *用檔案系統判斷是否為目錄*：需額外發送 PROPFIND/WebDAV 請求查詢目標型別，成本高且需處理網路錯誤，過於複雜。
  - *一律依 remotePath 有無副檔名判斷*：不可靠，目錄名也可能含點號。
  - *讓 `filename` 變數正常工作*：`path.basename('/Docs/')` 在 Windows 與 POSIX 的結果不同（node path 在 Windows 會把 `/` 視為分隔符，`path.basename('/Docs/')` 回傳空字串或 `Docs` 依環境而異），不可靠。直接判斷結尾 `/` 最明確。
- **採用理由**：以 `/` 結尾是最明確且與 CLI 語意一致的判斷方式，實作簡單、無額外請求。

**Decision 2：移除無用的 `filename` 變數**

現有 `const filename = path.basename(remotePath)`（第 72 行）是錯誤的根源──它從未在使用者指定目錄時被正確使用。修正時改以 `path.basename(localPath)` 作為拼接來源，並移除原 `filename` 變數以避免混淆。

## Risks / Trade-offs

- **[風險] 使用者傳入以 `/` 結尾但實際是單一檔案的怪異目標（如 `/file.txt/`）** → 系統會視為目錄並拼接檔名。但這是使用者輸入錯誤，行為符合「目錄目標」語意，屬可接受範圍。
- **[風險] Windows 路徑分隔符（`\`）與 WebDAV URL（`/`）混淆** → 本變更僅處理 `localPath` 的 `basename`（讀取本機檔名），與 URL 建構無關；`remotePath` 一律以 `/` 處理，不受影響。
- **[風險] 檔案名稱含需要 URL 編碼的字元（空白、中文等）** → 現有實作已直接將路徑拼進 URL，本變更沿用相同方式，未引入新風險（此為既有限制，非本 change 範圍）。

## Migration Plan

- 無資料庫或持久化狀態變更，無需遷移。
- 部署即替換 `src/client/sspApi.js`。
- 回滾：還原 `uploadFile()` 的 URL 建構邏輯即可，無副作用。
