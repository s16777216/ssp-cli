# Design: unify-error-messages

## Context

See proposal.md — Why. Current state (verified against source):

- The API layer (`src/client/sspApi.js`) mixes **prefixed and unprefixed** returns: `uploadFile`/`createFolder`/`copyFile`/`statPath`/`searchFiles` return `錯誤: …`-style messages, while `moveFile` returns `Error: …`-style. `deleteFile`/`downloadFile` fallback to raw server text (`err.response?.data || err.message`) — already unprefixed.
- The command layer wraps some results in another prefix (`mkdir.js:38`, `cp.js:32/80`, `mv.js:31/69/77`), producing the double-prefix bugs (`錯誤: 錯誤: 資料夾已存在`, `Error: Error: 目標已存在`).
- `createFolder` (sspApi.js:283) classifies the 405 "exists" condition by **parsing message text** (`result.data.message.includes('已存在')`) — language-coupled business logic.
- Non-fatal messaging is Chinese (`已登出`, `無符合結果`, prompts, warning); catch blocks use **three different formats** (`console.error("Error:", ...)`, `console.error("錯誤:", ...)`, `console.error(\`Error: ${...}\`)`).
- The `file-move` spec contains a `目標目錄不存在` scenario that the implementation does not emit (a 409 from a missing parent directory is classified as `cross-fs`). Known pre-existing drift — see Risks.

## Goals / Non-Goals

**Goals:**
- Establish a single message contract: `API 層回裸訊息`、`Command 層加 Error: 前綴`（前綴恰一次）。
- All user-visible CLI output becomes English (error / success / progress / prompts / warning / empty-result).
- Decouple the `createFolder` recursion from message text via structured `status: 'exists'`.
- Unify catch-block and fallback formats.
- Keep runtime behavior identical except the message text/format itself.

**Non-Goals:**
- Translating server-originated error bodies (e.g. `err.response?.data` passthrough) — out of our control; documented separately.
- Changing WebDAV status classification (`moveFile` 409→`cross-fs`, etc.).
- Rewriting README prose (Chinese docs stay Chinese); only quoted CLI-output examples in README get updated.
- Touching `--help`/option descriptions (already English).
- Altering exit codes or control flow beyond the two format-sensitive sites below.

## Decisions

### D1 — Prefix ownership: command layer only, applied exactly once

The API/client layer returns **raw, unprefixed** English messages in `data.message` / throws raw `Error` objects; every command displays errors as `Error: <message>`.

- Rationale: single responsibility (presentation lives at the CLI boundary), eliminates all four double-prefix sites (mkdir+405, cp+copyFile, cp+statPath, mv+moveFile/statPath) structurally instead of by fixing each string.
- Alternative considered: keep the prefix at the API layer and strip/normalize in commands — rejected: leaves presentation logic in two layers and perpetuates the mixed-prefix state.
- Result: `mv.js` needs **no logic change** at L31/69/77 — once `moveFile`/`statPath` drop their prefix, its existing `Error: ${...}` wrapper becomes correct automatically.

### D2 — `createFolder` 405 → structured `status: 'exists'` (message-text decoupling)

Change `mkcolRequest` to return `{ status: 'exists' }` (no `data.message`) for 405, mirroring the existing 412→`'exists'` convention in `copyFile`/`moveFile`. The recursion in `createFolder` aborts **only on `status === 'error'`**; `'exists'` continues silently. `mkdir.js` gains an explicit `exists` branch.

- Preserves current observable behavior exactly:
  - `ssp mkdir /A` (single) where `/A` exists → `Error: Folder already exists - /A`, exit 1 (matches today's error path via the 405 message).
  - `ssp mkdir -p /a/b/c` where any segment exists → silent success (matches today: recursion swallows `已存在` and returns `success`).
- Alternative considered: keep `includes('已存在')` but on the translated English text — rejected: remains fragile language-coupling; the whole point is a language-independent contract.
- 409 (`父目錄不存在`) / 403 (`權限不足`) map to `status: 'error'` with English messages, unchanged in shape.

### D3 — Message text: single English content mapping

All static strings translated per the table in tasks.md. Standard prefixes: `Error: ` for errors, `Warning: ` for warnings, plain `console.log` for success/info/prompts/progress. No punctuation "Error:," comma form anywhere.

### D4 — Uniform catch and fallback format

- All `catch` blocks: `console.error(\`Error: ${err.message}\`)` (replaces `"Error:", err.message`, `"錯誤:", err.message`, and `"Login failed:", err.message` forms).
- All fallbacks: `"Unknown error"` (already the dominant convention; `download.js:69` local `let errorMsg = "Unknown error"` pattern retained, only its prefix/output line changes).

## Risks / Trade-offs

- **[Known spec/impl drift]** `file-move` `目標目錄不存在` scenario is not produced by the implementation (missing parent → 409 → `cross-fs` message). → The delta keeps the translated text; **do not** change 409 classification in this change. Add a `verify` task to confirm the drift is flagged, and record the finding for a future behavior fix.
- **[Language-coupled logic is subtle]** The `createFolder` recursion only swallows `'exists'`; any other error aborts with the current segment's message. → D2 keeps sibling statuses (`error` for 409/403) untouched; implementation must re-verify both single and recursive paths (mirrors spec scenarios).
- **[Tests asserting Chinese strings]** `test/search.test.js:118` mocks `伺服器錯誤`. → Update it; implementation task audits `test/` for any other Chinese-string assertions.
- **[Server passthrough text]** `err.response?.data` fallbacks forward server bodies (often Chinese). → Out of scope; strings we author are English. Note for `error-handling` spec interpretation: it governs messages the CLI composes, not server passthrough.
- **[README stale examples]** Progress format (`上傳中... 65% …`) appears in README. → Update the quoted CLI-output lines to English (prose stays Chinese).
- **[Comma-form output]** `console.log("Result:", …)` in `ls.js` is debug output; leave as-is (it's an object dump, not a user message).

## Migration Plan

- Single atomic change: all files updated together (no partial English/Chinese mix in any release).
- Rollback: revert the change's commits; because this is purely output formatting with no state/schema changes, rollback is safe.
- No data migration, no new dependencies, no config changes.