const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("mkdir <remotePath>")
    .description("Create a folder on remote server")
    .option("-p, --parents", "Create parent directories as needed", false)
    .action(async (remotePath, options) => {
      const SSPApi = require("../client/sspApi");
      const configManager = require("../client/configManager");
      const { c } = require("./utils");
      
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

        console.log(`建立資料夾: ${remotePath}`);
        
        const result = await api.createFolder(remotePath, {
          recursive: options.parents
        });
        
        if (result && result.status === "success") {
          console.log(`建立完成: ${remotePath}`);
        } else {
          console.error(`錯誤: ${result.data ? result.data.message : "Unknown error"}`);
          process.exit(1);
        }
      } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
};