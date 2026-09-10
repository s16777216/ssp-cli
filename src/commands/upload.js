const fs = require("fs");
const path = require("path");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("upload <localFile> <remotePath>")
    .description("Upload a file to remote server")
    .action(async (localFile, remotePath) => {
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

        // Check if local file exists
        if (!fs.existsSync(localFile)) {
          console.error(`Error: File not found - ${localFile}`);
          process.exit(1);
        }

        console.log(`Uploading...`);
        
        let lastPercent = -1;
        
        const result = await api.uploadFile(localFile, remotePath, (progress) => {
          // Only update display every 5% or at 100%
          if (progress.percent === 100 || progress.percent - lastPercent >= 5) {
            lastPercent = progress.percent;
            // Use \r to overwrite the same line
            process.stdout.write(
              `\r${c.bold}Uploading...${c.reset} ${progress.percent}% (${progress.loaded} / ${progress.total}) @ ${progress.speed}`
            );
          }
        });

        // Clear the progress line
        process.stdout.write("\r\x1b[K");
        
        if (result && result.status === "success") {
          console.log(`Upload complete: ${remotePath}`);
        } else {
          console.error(`Error: Upload failed - ${result.data ? result.data.message : "Unknown error"}`);
          process.exit(1);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};