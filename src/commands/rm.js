const path = require("path");
const readline = require("readline");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("rm <remotePath>")
    .description("Remove a file or folder from remote server")
    .option("-y, --yes", "Skip confirmation prompt", false)
    .action(async (remotePath, options) => {
      const SSPApi = require("../client/sspApi");
      const configManager = require("../client/configManager");
      
      const api = new SSPApi();
      try {
        const username = configManager.get("username");
        if (!username) {
          console.error(
            "Please login first using: ssp login -u <user> -p <pass>",
          );
          process.exit(1);
        }

        const savedToken = configManager.get("requesttoken");
        const savedCookies = configManager.get("cookies");

        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        // Parse dirname and filename
        const parsedPath = path.posix.parse(remotePath);
        const dir = parsedPath.dir || "/";
        const filename = parsedPath.base;

        if (!filename) {
          console.error("Error: Invalid remote path");
          process.exit(1);
        }

        // Skip confirmation if -y/--yes flag is set
        if (!options.yes) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          rl.question(`確認刪除 ${remotePath}? [y/N] `, async (answer) => {
            rl.close();
            if (answer.trim().toLowerCase() === "y") {
              console.log(`刪除中...`);
              const result = await api.deleteFile(dir, filename);
              if (result && result.status === "success") {
                console.log(`刪除完成: ${remotePath}`);
              } else {
                console.error(
                  `錯誤: 刪除失敗 - ${result.data ? result.data.message : "Unknown error"}`,
                );
                process.exit(1);
              }
            } else {
              console.log("已取消刪除");
            }
          });
        } else {
          console.log(`刪除中...`);
          const result = await api.deleteFile(dir, filename);
          if (result && result.status === "success") {
            console.log(`刪除完成: ${remotePath}`);
          } else {
            console.error(
              `錯誤: 刪除失敗 - ${result.data ? result.data.message : "Unknown error"}`,
            );
            process.exit(1);
          }
        }
      } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
};