# node-ssp-cli

Node.js CLI 工具，用於操作 Mailcloud (SecuSharePro) 雲端檔案儲存系統。

基於 ownCloud/Nextcloud WebDAV 協定，提供登入、檔案管理、目錄操作等功能。

## 安裝

```bash
# 全局安裝（從 npm registry）
npm install -g @s16777216/ssp-cli

# 或本地使用（不經安裝）
node src/cli.js <command>
```

## 登入

```bash
ssp login
# 輸入密碼後，憑證與 Cookie 會儲存至 ~/.ssp-config.json
```

## 指令

| 指令       | 說明            | 範例                             |
| ---------- | --------------- | -------------------------------- |
| `login`    | 登入 Mailcloud  | `ssp login`                      |
| `ls`       | 列出檔案/目錄   | `ssp ls /Documents`              |
| `rm`       | 刪除檔案/資料夾 | `ssp rm -y /old.txt`             |
| `upload`   | 上傳檔案        | `ssp upload ./local.pdf /Docs/`  |
| `download` | 下載檔案        | `ssp download /Docs/file.pdf ./` |
| `mkdir`    | 建立資料夾      | `ssp mkdir -p /A/B/C`            |
| `mv`       | 移動/重命名     | `ssp mv /old.txt /new.txt`       |
| `cp`       | 複製檔案        | `ssp cp -r /Dir /Backup/`        |
| `logout`   | 登出清除憑證    | `ssp logout`                     |
| `search`   | 搜尋檔案        | `ssp search report`              |

## ls 列出檔案

```bash
ssp ls -d /                       # 根目錄 (使用 -d 指定目錄路徑)
ssp ls -a                         # 顯示所有欄位
ssp ls -s                         # 顯示檔案大小
ssp ls -D                         # 顯示修改日期
ssp ls -p                         # 顯示權限
ssp ls -o                         # 顯示擁有者
```

## rm 刪除檔案

```bash
ssp rm /file.txt                  # 預設互動確認
ssp rm -y /file.txt               # 跳過確認
```

## upload 上傳檔案

```bash
ssp upload ./local.pdf /Docs/             # 上傳到目錄
ssp upload ./file.txt /remote.txt         # 重命名上傳
```

進度顯示：`上傳中... 65% (3.2 MB / 5.0 MB) @ 256 KB/s`

## download 下載檔案

```bash
ssp download /Docs/file.pdf ./            # 下載到當前目錄
ssp download /Docs/file.pdf ./local.pdf   # 重命名下載
```

## mkdir 建立資料夾

```bash
ssp mkdir /NewFolder                      # 建立單層
ssp mkdir -p /A/B/C                       # 遞迴建立
```

## mv 移動/重命名

```bash
ssp mv /old.txt /new.txt                  # 重命名
ssp mv /file.txt /Archive/                # 移動到目錄
ssp mv -i /src.txt /dst.txt               # 目標存在時確認
```

## cp 複製檔案

```bash
ssp cp /file.txt /copy.txt                # 複製檔案
ssp cp -r /Dir /Backup/                   # 遞迴複製目錄
ssp cp -i /src.txt /dst.txt               # 目標存在時確認
```

## search 搜尋檔案

```bash
ssp search report                         # 搜尋檔名
ssp search -c keyword                     # 搜尋內容
ssp search -t file keyword                # 僅搜尋檔案
ssp search -t dir keyword                 # 僅搜尋目錄
ssp search --json keyword                 # JSON 輸出
```

## logout 登出

```bash
ssp logout                                # 清除本地憑證
ssp logout --all                          # 同時撤銷伺服器 session
```

## 輸出格式

`ls` 與 `search` 的表格輸出使用 `cli-table3`，可透過環境變數關閉顏色：

```bash
NO_COLOR=1 ssp ls /
```

## 設定檔

憑證與 Cookie 儲存於 `~/.ssp-config.json`，包含：

- `username` - 使用者帳號
- `password` - 密碼（建議登入後立即更改）
- `token` - CSRF Token
- `cookies` - Session Cookies

## 注意事項

- 密碼會以明文儲存於設定檔，建議登入後更改 Mailcloud 密碼
- Cookie 有效期由伺服器決定，過期後需重新登入
- 大檔案上傳/下載會顯示進度，支援暫停續傳