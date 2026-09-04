## 1. 建立 Skill 檔案

- [ ] 1.1 建立 `skills/ssp-cli/SKILL.md`，含有效 frontmatter（`name: ssp-cli`、`description`），內容為精簡觸發卡：說明何時該用 `ssp` 操作 Mailcloud、指示 agent 一律先跑 `ssp --help` 取得指令清單
- [ ] 1.2 在 SKILL.md 中加入 5 個常用情境範例（ls/upload/download/rm/mkdir），作為 agent 的語法起點
- [ ] 1.3 在 SKILL.md 中加入登入邊界處理：註明 `ssp` 需登入，遇未登入/401 時停止並回報使用者先執行 `ssp login`

## 2. 驗證 Skill 可被發現

- [ ] 2.1 執行 `npx skills add ./skills --list`（或 `-l`），確認列出 `ssp-cli` 為可用 skill
- [ ] 2.2 檢查 SKILL.md 內容符合「精簡觸發卡」目標（agent 通用、不窮舉指令、以 `ssp --help` 為動態來源）
