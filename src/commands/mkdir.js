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
            "Error: Please login first using: ssp login -u <user> -p <pass>",
          );
          process.exit(1);
        }

        const savedToken = configManager.get("requesttoken");
        const savedCookies = configManager.get("cookies");

        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        console.log(`Creating folder: ${remotePath}`);
        
        const result = await api.createFolder(remotePath, {
          recursive: options.parents
        });
        
        if (result && result.status === "success") {
          console.log(`Folder created: ${remotePath}`);
        } else if (result && result.status === "exists") {
          console.error(`Error: Folder already exists - ${remotePath}`);
          process.exit(1);
        } else {
          console.error(`Error: ${result.data ? result.data.message : "Unknown error"}`);
          process.exit(1);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};