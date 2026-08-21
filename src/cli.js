#!/usr/bin/env node

const { Command } = require('commander');
const readline = require('readline');
const path = require('path');
const SSPApi = require('./client/sspApi');
const configManager = require('./client/configManager');

// ANSI Color Detection & Codes
const isColorSupported = () => {
  if (process.env.NO_COLOR) return false;                      // 與 https://no-color.org/ 相容
  if (process.env.FORCE_COLOR) return true;                   // 強制啟用
  if (!process.stdout.isTTY) return false;                    // 非終端 (pipe / 重導向) 關閉
  if (process.platform === 'win32') return true;              // Windows 10+ 支援 VT100
  return process.env.TERM !== 'dumb';                        // 其他平台看 TERM
};

const useColor = isColorSupported();

const c = {
  dir:  useColor ? '\x1b[1;34m' : '',   // 亮藍色 (資料夾)
  file: useColor ? '\x1b[0m'    : '',   // 預設色 (檔案)
  dim:  useColor ? '\x1b[2m'    : '',   // 灰色 (輔助資訊)
  bold: useColor ? '\x1b[1m'    : '',   // 粗體
  reset:useColor ? '\x1b[0m'    : '',   // 重設
};

// Permission Decoder
const decodePermissions = (perm) => {
  if (typeof perm === 'string') return perm;          // 已是字串 (RWDN)
  if (typeof perm !== 'number') return '';

  const bits = [
    ['R', 1],   // 讀取
    ['W', 2],   // 寫入
    ['D', 4],   // 刪除
    ['C', 8],   // 建立
    ['K', 16],  // 變更
    ['S', 32],  // 分享
  ];

  return bits.map(([label, bit]) => (perm & bit) ? label : '-').join('');
};

// Get effective permissions: sharePermissions > permissions
// But external storage mount points (shared-root) don't allow deletion even if D bit is set
const getEffectivePerm = (file) => {
  let perm = file.permissions;
  if (file.sharePermissions !== undefined && file.sharePermissions !== null) {
    perm = file.sharePermissions;
  }
  // External storage mount points don't allow deletion regardless of permissions
  if (file.isShareMountPoint && file.mountType === 'shared-root') {
    // Remove D (delete) bit - external storage doesn't allow deletion
    perm = perm & ~4;  // Clear bit 4 (D)
  }
  return perm;
};

// Get owner display name
const getOwner = (file) => {
  if (file.displayOwner) return file.displayOwner;
  if (file.shareOwner) return file.shareOwner;
  return '';
};

const program = new Command();

program
  .name('ssp')
  .description('CLI tool for Mailcloud SecuSharePro / ownCloud')
  .version('1.0.0');

program
  .command('login')
  .description('Login to Mailcloud')
  .requiredOption('-u, --user <username>', 'Username / Email')
  .requiredOption('-p, --password <password>', 'Password')
  .action(async (options) => {
    const api = new SSPApi();
    try {
      console.log('Logging in...');
      const result = await api.login(options.user, options.password);
      configManager.save({
        username: options.user,
        password: options.password,
        requesttoken: result.requesttoken,
        cookies: result.cookies
      });
      console.log('Login successful! Credentials saved.');
    } catch (err) {
      console.error('Login failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List files in directory')
  .option('-d, --dir <path>', 'Directory path', '/')
  .option('-a, --all', 'Show all fields (size + date + permissions + owner)', false)
  .option('-s, --size', 'Show file size', false)
  .option('-D, --date', 'Show modification date', false)
  .option('-p, --perm', 'Show permissions', false)
  .option('-o, --owner', 'Show owner', false)
  .action(async (options) => {
    const api = new SSPApi();
    try {
      const username = configManager.get('username');
      if (!username) {
        console.error('Please login first using: ssp login -u <user> -p <pass>');
        process.exit(1);
      }

      const savedToken = configManager.get('requesttoken');
      const savedCookies = configManager.get('cookies');

      // 恢復儲存的 Token 與 Cookie
      if (savedToken) api.requesttoken = savedToken;
      if (savedCookies) api.setCookieString(savedCookies);

      console.log(`Listing files in ${options.dir}...`);

      const result = await api.listFiles(options.dir);
      
      if (result && result.status === 'success' && result.data && result.data.files) {
        console.log(`\n${c.bold}--- Files & Folders ---${c.reset}`);
        result.data.files.forEach(file => {
          const isDir = file.type === 'dir';
          const name  = isDir
            ? `${c.dir}${file.name}${c.reset}`
            : `${c.file}${file.name}${c.reset}`;

          const showAll    = options.all;
          const showSize   = showAll || options.size;
          const showDate   = showAll || options.date;
          const showPerm   = showAll || options.perm;
          const showOwner  = showAll || options.owner;

          const parts = [`  ${name}`];

          if (showSize) parts.push(`${c.dim}${(file.size / 1024).toFixed(1)} KB${c.reset}`);
          if (showDate) parts.push(`${c.dim}${file.date}${c.reset}`);
          if (showPerm) parts.push(decodePermissions(getEffectivePerm(file)));
          if (showOwner) {
            const owner = getOwner(file);
            if (owner) parts.push(`${c.dim}${owner}${c.reset}`);
          }

          console.log(parts.join('  '));
        });
      } else {
        console.log('Result:', JSON.stringify(result, null, 2));
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('delete <remotePath>')
  .description('Delete a file or folder from remote server')
  .action(async (remotePath) => {
    const api = new SSPApi();
    try {
      const username = configManager.get('username');
      if (!username) {
        console.error('Please login first using: ssp login -u <user> -p <pass>');
        process.exit(1);
      }

      const savedToken = configManager.get('requesttoken');
      const savedCookies = configManager.get('cookies');

      if (savedToken) api.requesttoken = savedToken;
      if (savedCookies) api.setCookieString(savedCookies);

      // Parse dirname and filename
      const parsedPath = path.posix.parse(remotePath);
      const dir = parsedPath.dir || '/';
      const filename = parsedPath.base;

      if (!filename) {
        console.error('Error: Invalid remote path');
        process.exit(1);
      }

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`確認刪除 ${remotePath}? [y/N] `, async (answer) => {
        rl.close();
        if (answer.trim().toLowerCase() === 'y') {
          console.log(`刪除中...`);
          const result = await api.deleteFile(dir, filename);
          if (result && result.status === 'success') {
            console.log(`刪除完成: ${remotePath}`);
          } else {
            console.error(`錯誤: 刪除失敗 - ${result.data ? result.data.message : 'Unknown error'}`);
            process.exit(1);
          }
        } else {
          console.log('已取消刪除');
        }
      });
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
