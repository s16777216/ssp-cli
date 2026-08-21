#!/usr/bin/env node

const { Command } = require('commander');
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
          const size = `${c.dim}${(file.size / 1024).toFixed(1)} KB${c.reset}`;
          const date = `${c.dim}${file.date}${c.reset}`;
          console.log(`  ${name}  ${size}  ${date}`);
        });
      } else {
        console.log('Result:', JSON.stringify(result, null, 2));
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
