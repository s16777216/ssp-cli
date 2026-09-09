# Glossary

## core

- **ExampleTerm** — Definition of example domain term. Aliases: alias1, alias2.

## file-search

- **Mailcloud** — SecuSharePro 雲端儲存服務名稱。Aliases: SecuSharePro。
- **ownCloud** — 底層開源平台，Mailcloud 基於此。
- **AJAX 端點** — ownCloud 內部 API (`/index.php/apps/files/ajax/...`)。
- **WebDAV COPY/MOVE** — RFC 4918 標準檔案操作協定。
- **requesttoken** — CSRF token，ownCloud 請求所需。
- **掛載點** — External storage mount point，外部儲存掛載點。Aliases: mount point。
- **全文索引 / FTS** — Full Text Search，檔案內容搜尋需此功能。Aliases: Full Text Search。

## file-move

- **Mailcloud** — SecuSharePro 雲端儲存服務名稱。Aliases: SecuSharePro。
- **ownCloud** — 底層開源平台，Mailcloud 基於此。
- **WebDAV MOVE** — RFC 4918 標準移動操作協定。
- **412 Precondition Failed** — HTTP 狀態碼，表示目標已存在。
- **Overwrite header** — HTTP 標頭，`Overwrite: T/F` 控制覆蓋行為。
- **跨儲存空間移動** — Cross-storage move，WebDAV MOVE 不支援。Aliases: cross-fs move。

## auth-logout

- **Mailcloud** — SecuSharePro 雲端儲存服務名稱。Aliases: SecuSharePro。
- **ownCloud** — 底層開源平台，Mailcloud 基於此。
- **requesttoken** — CSRF token，ownCloud 請求所需。
- **~/.ssp-config.json** — 本地憑證儲存檔案（含 username, password, requesttoken, cookies）。Aliases: ssp-config。
- **冪等** — 重複執行結果相同的操作特性。Aliases: idempotent。