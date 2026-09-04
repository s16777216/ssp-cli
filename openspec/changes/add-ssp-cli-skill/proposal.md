## Why

目前 ssp-cli 已能透過 `npm install -g @s16777216/ssp-cli` 安裝，`ssp` 指令也已全域可用。但 coding agent（如 claude-code、codex、opencode）在開發本專案、需要實際操作 Mailcloud/SecuSharePro 雲端檔案（上傳/下載/列檔等）時，沒有明確指引告訴它「何時該直接呼叫 `ssp` 指令、怎麼用、沒登入時怎麼處理」。導致 agent 傾向讀程式碼而非實際操作雲端，或不清楚呼叫邊界。

## What Changes

- 新增一個 agent skill 定義檔 `skills/ssp-cli/SKILL.md`，讓 coding agent 在使用本工具操作 Mailcloud 雲端檔案時有明確指引。
- Skill 為**精簡觸發卡**：只寫「何時該用 `ssp`」「一律先以 `ssp --help` 取得指令清單」以及 5 個常用情境範例（ls/upload/download/rm/mkdir）。
- Skill 撰寫採 **agent 通用**風格：不綁特定 agent，任何支援 skill 的 coding agent 載入後皆可用。
- 憑證採**嘗試式**：skill 註明 `ssp` 需登入；agent 若遇未登入/401，停止並回報使用者先執行 `ssp login`。
- Skill 位於專案 `skills/ssp-cli/` 目錄（`skills/` 為 `npx skills` CLI 官方識別的 skill container 結構），隨 repo 開發，未來可 push 至 GitHub 供 `npx skills add` 安裝。
- **不含**實際 push 到 GitHub（本 change 只建立 skill 檔並完成本機可發現性驗證）。

## Capabilities

### New Capabilities
- `ssp-cli-skill`: 定義 ssp-cli 作為 coding agent 可載入使用的 skill 所需具備的檔案結構、內容、與使用指引條件，使 agent 能正確呼叫 `ssp` 操作 Mailcloud 雲端檔案。

### Modified Capabilities
<!-- 無既有 capability 的需求需要修改 -->

## Impact

- **新增檔案**：`skills/ssp-cli/SKILL.md`（精簡觸發卡）。
- **程式碼**：無變更（不修改 ssp-cli 執行邏輯）。
- **介面**：coding agent 取得「可用 `ssp` 指令操作 Mailcloud」的能力。
- **驗證**：以 `npx skills add ./skills --list`（或 `-l`）確認 skill 可被 `npx skills` CLI 發現，作為可交付的驗證依據。
- **無**：不實際 push、不修改 CLI、不新增 runtime 依賴、不建立 additional 附屬檔（單一 SKILL.md）。
