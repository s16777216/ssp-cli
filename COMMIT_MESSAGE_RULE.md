# Commit Message 規範

本專案使用 [semantic-release](https://github.com/semantic-release/semantic-release) 自動發布，版本號由 commit message 判斷。所有 commit 必須遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/) 格式。

## 格式

```
<type>(<scope>): <subject>

<body>

BREAKING CHANGE: <description>
```

## Type 對應的版本變更

| Type | 用途 | 版本變更 |
| ---- | ---- | -------- |
| `feat` | 新功能 | minor（`0.1.0 → 0.2.0`） |
| `fix` | 錯誤修正 | patch（`0.1.0 → 0.1.1`） |
| `docs` | 文件（README 等） | 不發布 |
| `chore` | 雜務（依賴、設定） | 不發布 |
| `refactor` | 重構（不變行為） | 不發布 |
| `style` | 格式調整 | 不發布 |
| `test` | 測試 | 不發布 |
| `perf` | 效能優化 | 不發布 |
| `ci` | CI/CD 設定 | 不發布 |
| `build` | 建置系統 | 不發布 |
| `revert` | 還原 commit | 依還原內容而定 |

> `BREAKING CHANGE:` 於 body 中出現時，無論 type 為何皆為 **major**（`0.1.0 → 1.0.0`）。

## 範例

### feat（新功能）

```bash
git commit -m "feat: 新增 mv 指令"
```

### fix（錯誤修正）

```bash
git commit -m "fix: 修正登入逾時問題"
```

### 破壞性變更（major）

```bash
git commit -m "feat: 改用新 API

BREAKING CHANGE: 移除舊端點 /index.php/apps/files/ajax/search.php"
```

### 帶 scope（影響範圍）

```bash
git commit -m "feat(cp): 支援遞迴複製目錄"
```

## 規則

1. **type 必填**，且為上述清單之一
2. **subject 不可省略**，使用祈使句、小寫開頭
3. subject 不超過 50 字元
4. type 與 subject 之間有**一個空格**（`feat: xxx`），`feat(xxx): xxx` 的 scope 與 `:` 之間**沒有空格**
5. 錯誤的格式會被 semantic-release 忽略，導致**不會發布新版本**

## 錯誤範例（不會觸發發布）

```bash
git commit -m "修正登入逾時"          # 缺少 type
git commit -m "update: 更新說明"       # update 不在清單
git commit -m "fix 修正 bug"           # 缺少冒號
git commit -m "Feat: 新增功能"         # type 需為小寫
```