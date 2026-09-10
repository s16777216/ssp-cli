const SSPApi = require("../client/sspApi");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("login")
    .description("Login to Mailcloud")
    .requiredOption("-u, --user <username>", "Username / Email")
    .requiredOption("-p, --password <password>", "Password")
    .action(async (options) => {
      const api = new SSPApi();
      try {
        console.log("Logging in...");
        const result = await api.login(options.user, options.password);
        configManager.save({
          username: options.user,
          password: options.password,
          requesttoken: result.requesttoken,
          cookies: result.cookies,
        });
        console.log("Login successful! Credentials saved.");
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};