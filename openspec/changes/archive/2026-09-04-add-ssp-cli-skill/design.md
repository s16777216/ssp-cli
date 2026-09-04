## Context

本專案為 `s16777216/ssp-cli`（操作 Mailcloud/SecuSharePro 雲端檔案的 Node CLI）。前一個 change `publish-to-npm` 已將它打包為 `@s16777216/ssp-cli` 並驗證 `ssp` 在 PATH 全域可用。coding agent 在開發/測試本專案時，需要能實際呼叫 `ssp` 操作雲端檔案（而非讀程式碼），但目前缺少一份指引 agent 何時/如何使用的 skill 定義檔。

`npx skills`（vercel-labs/skills）是跨 agent 的 skill 安裝 CLI，GitHub 為 registry；官方識別的 skill container 目錄包含 `skills/`（`skills/<name>/SKILL.md`、`skills/<cat>/<name>/SKILL.md`）。放在 `skills/ssp-cli/` 即符合官方可發現結構。

## Goals / Non-Goals

**Goals:**
- 提供 `skills/ssp-cli/SKILL.md`（精簡觸發卡），讓 coding agent 能正確使用 `ssp` 操作 Mailcloud。
- 內容 agent 通用、以 `ssp --help` 動態取得指令、含 5 個常用情境範例、含登入邊界處理。
- 本機驗證 skill 可被 `npx skills add ./skills --list` 發現。

**Non-Goals:**
- 不實際 push 到 GitHub（本 change 只建立 skill 檔 + 本機發現性驗證）。
- 不修改 ssp-cli 任何執行邏輯。
- 不建立額外附屬檔（僅單一 SKILL.md）。
- 不窮舉所有指令（靠 `ssp --help` 動態）。
- 不綁定特定 agent。

## Decisions

**Decision 1：Skill 存放於 `skills/ssp-cli/SKILL.md`**

採用 `skills/`（此為 `npx skills` 官方識別的 container 目錄），skill 子目錄名 `ssp-cli` 與 frontmatter 的 `name: ssp-cli` 一致。
- **替代方案**：`.opencode/skills/`（僅 opencode 專屬）——不符合「發布給多 agent 使用」的目標。
- **採用理由**：官方標準結構，`npx skills add` 可直接發現；與 repo 一起通吃，未來 push 到 `s16777216/ssp-cli` 即可分發。

**Decision 2：精簡觸發卡，而非完整操作指南**

SKILL.md 只寫「何時該用 ssp」「先 `ssp --help` 取得指令」「5 個常用情境範例」「登入邊界」。不做完整指令語法表。
- **替代方案**：完整操作指南（列出所有指令詳細語法）——偏離使用者「精簡觸發卡」的要求，且易過時。
- **採用理由**：CLI 本身有 `--help`，skill 的價值在提示「何時用 + 語法起點 + 邊界」，而非重複文件。

**Decision 3：指令不窮舉，以 `ssp --help` 為準**

SKILL.md 指示 agent 一律先跑 `ssp --help` 取得指令清單，並提供 ls/upload/download/rm/mkdir 五個最常用情境的範例作為起點。
- **採用理由**：CLI 進化（未來會加 search/logout/cp/mv）時 skill 不需同步維護；精簡且永不過時。

**Decision 4：agent 通用寫法**

SKILL.md 以中性的「何時/如何用 ssp」撰寫，不假設特定 agent（claude-code/codex/opencode 皆可載入）。
- **採用理由**：要發布給大眾 + `npx skills` 是跨 agent 工具。

**Decision 5：憑證採嘗試式 + 邊界處理**

Skill 註明 `ssp` 需登入（`~/.ssp-config.json`）；agent 執行時若遇未登入/401，停止、不盲目重試，回報使用者先 `ssp login`。
- **替代方案**：前提式（要求使用者已登入才可操作）——較被動；嘗試式讓 agent 直接試、失敗才回報，更符合精簡觸發卡。
- **採用理由**：避免 agent 反覆重試失敗，給出明確的失敗出路。

## Risks / Trade-offs

- **[風險] skill 內容與實際 CLI 指令脫節** → 指令以 `ssp --help` 為動態來源，5 個範例均為高穩定性常用指令；未來若 CLI 增刪指令，skill 核心仍有效。
- **[風險] 若未來指令名稱/旗標改變，範例可能過時** → 範例僅作「語法起點」，agent 應以 `ssp --help` 最終確認。
- **[風險] `npx skills add ./skills --list` 驗證需網路/CLI 下載** → 本機已有 `npx skills` 可用（先前已確認）；驗證為可重現步驟。
- **[風險] 未實際 push，skill 尚未對外分發** → 本 change Scope 明確排除 push；分發留待後續手動步驟。

## Migration Plan

- 無資料庫/狀態遷移；新增單一檔案 `skills/ssp-cli/SKILL.md`。
- 回滾：刪除該檔案即可，無副作用。
- 實際 push 至 GitHub 分發為 change 完成後的**手動**步驟（`git add skills/` + push，之後 `npx skills add s16777216/ssp-cli` 可安裝）。
