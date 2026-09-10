const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("logout")
    .description("Logout and clear local credentials")
    .option("--all", "Also revoke server session", false)
    .action(async (options) => {
      const SSPApi = require("../client/sspApi");
      const configManager = require("../client/configManager");

      const api = new SSPApi();
      try {
        // Check if logged in
        const username = configManager.get("username");
        if (!username) {
          console.log("Logged out");
          return;
        }

        const savedToken = configManager.get("requesttoken");
        const savedCookies = configManager.get("cookies");

        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        // If --all flag, call server logout API first
        if (options.all) {
          const logoutResult = await api.logout();
          if (logoutResult.status === 'error') {
            console.warn(`Warning: Server logout failed, local credentials cleared`);
          }
        }

        // Clear local config
        configManager.clear();

        if (options.all) {
          console.log("Logged out (including server session)");
        } else {
          console.log("Logged out");
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};