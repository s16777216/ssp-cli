# Proposal: unify-error-messages

## Why

Currently the CLI mixes Chinese (`錯誤: `) and English (`Error: `) error prefixes across commands, with some messages double-prefixed (`錯誤: 錯誤: 資料夾已存在` from API + command layers both adding prefixes), and success/interactive/progress text is predominantly Chinese while `--help` text is English. This inconsistency hurts scripted consumption and makes the output language unpredictable.

## What Changes

- **Unify all user-visible CLI output to English**: error, success, interactive prompts, progress, warning, and empty-result messages.
- **Establish a single error-message contract**: 

  - The API/client layer (`src/client/*.js`) returns *raw, unprefixed* English messages.
  - The command layer is the *only* place that adds the `Error: ` prefix.
  - Fallback message is always `Unknown error`.
  - `catch` blocks print `Error: ${err.message}` (template form, no `Error:,` comma form).

- **Fix double-prefix bugs**: e.g. `錯誤: 錯誤: 資料夾已存在` (mkdir) and `Error: Error: 目標已存在` (mv), which disappear once the prefix is applied at exactly one layer.
- **Remove the language-coupled check** in `createFolder` recursion (`message.includes('已存在')`): change the 405 response to `status: 'exists'` (consistent with the existing 412 `exists` convention in copyFile/moveFile) so recursion aborts only on `status: 'error'`.
- **BREAKING (CLI output)**: all user-visible message texts change from Chinese to English. Consumers that parse CLI output (progress format, success lines, prompts) must update.

## Capabilities

### New Capabilities

- `error-handling`: Defines the cross-cutting contract for user-facing CLI messages — English language, `Error: ` prefix applied only at the command layer, raw unprefixed messages from the API layer, `Unknown error` fallback, and uniform catch formatting.

### Modified Capabilities

- `file-upload`: Update user-visible message texts to English (`錯誤: 檔案不存在`, `上傳完成:`, `上傳中...`).
- `file-copy`: Update user-visible message texts to English (`錯誤: 來源為資料夾，請使用 -r`, `錯誤: 來源不存在`, `目標已存在，覆蓋？ [y/N]`, `複製完成:`).
- `file-move`: Update user-visible message texts to English (`Error: 來源不存在`, `Error: 不支援跨儲存空間移動，請改用 cp + rm`, `Error: 目標目錄不存在`, `移動完成:`, `已取消移動`, `目標已存在，覆蓋？ [y/N]`).
- `file-search`: Update user-visible message texts to English (`錯誤:` prefix → `Error: `, `無符合結果`).
- `auth-logout`: Update user-visible message texts to English (`已登出`, `已登出 (含伺服器 session)`, `警告: 伺服器登出失敗，但本地憑證已清除`).

## Impact

- `src/client/sspApi.js` — 16 error messages translated to English and unprefixed; `createFolder` 405 responses change to `status: 'exists'`; recursive folder creation logic decoupled from message text.
- `src/commands/*.js` (upload, download, cp, mkdir, rm, mv, search, ls, login, logout) — all console output translated to English; error output standardized to `Error: <message>`; 6 "Please login first" messages gain the `Error: ` prefix; catch blocks unified to template form.
- `src/client/sspClient.js`, `src/client/configManager.js` — no change (already throw raw English `Error` objects, prefixed by the command layer).
- `test/search.test.js` — mock error message `伺服器錯誤` updated to `Server error`.
- Specs: 5 delta specs (file-upload, file-copy, file-move, file-search, auth-logout) + 1 new spec (error-handling).