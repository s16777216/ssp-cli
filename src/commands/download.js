const fs = require("fs");
const path = require("path");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("download <remotePath> [localDestination]")
    .description("Download a file from remote server")
    .action(async (remotePath, localDestination) => {
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

        // Determine local destination path
        let localPath;
        if (localDestination) {
          // Check if destination is a directory
          const destStat = fs.existsSync(localDestination) ? fs.statSync(localDestination) : null;
          const isDirectory = destStat && destStat.isDirectory();
          
          const filename = path.basename(remotePath);
          localPath = isDirectory ? path.join(localDestination, filename) : localDestination;
        } else {
          // Default to current working directory with original filename
          const filename = path.basename(remotePath);
          localPath = path.join(process.cwd(), filename);
        }

        console.log(`下載中...`);
        
        let lastPercent = -1;
        
        const result = await api.downloadFile(remotePath, localPath, (progress) => {
          // Only update display every 5% or at 100%
          if (progress.percent === 100 || progress.percent - lastPercent >= 5) {
            lastPercent = progress.percent;
            // Use \r to overwrite the same line
            process.stdout.write(
              `\r${c.bold}下載中...${c.reset} ${progress.percent}% (${progress.loaded} / ${progress.total}) @ ${progress.speed}`
            );
          }
        });

        // Clear the progress line
        process.stdout.write("\r\x1b[K");
        
        // Debug: log the full result for debugging
        // console.log('DEBUG result:', JSON.stringify(result, null, 2));
        
        if (result && result.status === "success") {
          console.log(`下載完成: ${localPath}`);
        } else {
          let errorMsg = "Unknown error";
          if (result.data) {
            if (result.data.message) {
              errorMsg = result.data.message;
            } else if (typeof result.data === 'object') {
              // Try to get a meaningful string from the object
              if (result.data.toString && result.data.toString !== Object.prototype.toString) {
                errorMsg = result.data.toString();
              } else {
                try {
                  errorMsg = JSON.stringify(result.data);
                } catch (e) {
                  errorMsg = Object.prototype.toString.call(result.data);
                }
              }
            } else {
              errorMsg = String(result.data);
            }
          }
          console.error(`錯誤: 下載失敗 - ${errorMsg}`);
          process.exit(1);
        }
      } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
      }
    });
};