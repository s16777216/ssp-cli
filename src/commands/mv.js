const readline = require("readline");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("mv <src> <dst>")
    .description("Move or rename a file or folder on remote server")
    .option("-y, --yes", "Automatically overwrite existing target without prompting", false)
    .action(async (src, dst, options) => {
      const SSPApi = require("../client/sspApi");

      const api = new SSPApi();
      try {
        const username = configManager.get("username");
        if (!username) {
          console.error(
            "Error: Please login first using: ssp login -u <user> -p <pass>",
          );
          process.exit(1);
        }

        const savedToken = configManager.get("requesttoken");
        const savedCookies = configManager.get("cookies");

        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        // Validate source exists first using statPath
        const stat = await api.statPath(src);
        if (stat.status === "error") {
          console.error(`Error: ${stat.data ? stat.data.message : "Unknown error"}`);
          process.exit(1);
        }

        // Attempt move (Overwrite: F). If target exists (412) and not -y, prompt.
        const attemptMove = async (overwrite) => {
          const result = await api.moveFile(src, dst, { overwrite });
          return result;
        };

        let result = await attemptMove(false);

        // 412 → target exists
        if (result.status === "exists") {
          if (options.yes) {
            result = await attemptMove(true);
          } else {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            const answer = await new Promise((resolve) => {
              rl.question(`Destination already exists, overwrite? [y/N] `, (ans) => {
                rl.close();
                resolve(ans.trim().toLowerCase());
              });
            });
            if (answer === "y") {
              result = await attemptMove(true);
            } else {
              console.log("Move cancelled");
              return;
            }
          }
        }

        // Cross-filesystem move not supported
        if (result.status === "cross-fs") {
          console.error(`Error: ${result.data ? result.data.message : "Unknown error"}`);
          process.exit(1);
        }

        if (result && result.status === "success") {
          console.log(`Move complete: ${dst}`);
        } else {
          console.error(
            `Error: ${result.data ? result.data.message : "Unknown error"}`,
          );
          process.exit(1);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};