const readline = require("readline");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("cp <src> <dst>")
    .description("Copy a file or folder on remote server")
    .option("-r, --recursive", "Recursively copy a folder (required when source is a folder)", false)
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

        // Determine source type (file vs folder) via PROPFIND Depth:0
        const stat = await api.statPath(src);
        if (stat.status === "error") {
          console.error(`Error: ${stat.data ? stat.data.message : "Unknown error"}`);
          process.exit(1);
        }

        const isCollection = stat.data.type === "collection";

        // Folder source requires -r flag (unless -r, error out)
        if (isCollection && !options.recursive) {
          console.error("Error: Source is a folder, use -r");
          process.exit(1);
        }

        // Attempt copy (Overwrite: F). If target exists (412) and not -y, prompt.
        const attemptCopy = async (overwrite) => {
          const result = await api.copyFile(src, dst, { overwrite });
          return result;
        };

        let result = await attemptCopy(false);

        // 412 → target exists
        if (result.status === "exists") {
          if (options.yes) {
            result = await attemptCopy(true);
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
              result = await attemptCopy(true);
            } else {
              console.log("Copy cancelled");
              return;
            }
          }
        }

        if (result && result.status === "success") {
          console.log(`Copy complete: ${dst}`);
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
