const { c, decodePermissions, getEffectivePerm, getOwner, createTable } = require("./utils");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("search <keyword>")
    .description("Search files on remote server")
    .option("-c, --content", "Search file content (requires server full-text index)", false)
    .option("-t, --type <type>", "Filter by type: file | dir | all", "all")
    .option("--json", "Output JSON array", false)
    .option("-a, --all", "Show all fields (size + date + permissions + owner)", false)
    .option("-s, --size", "Show file size", false)
    .option("-D, --date", "Show modification date", false)
    .option("-p, --perm", "Show permissions", false)
    .option("-o, --owner", "Show owner", false)
    .action(async (keyword, options) => {
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

        // 恢復儲存的 Token 與 Cookie
        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        // Validate type option
        const validTypes = ['file', 'dir', 'all'];
        if (!validTypes.includes(options.type)) {
          console.error(`錯誤: 無效的類型 "${options.type}"，可用選項: ${validTypes.join(', ')}`);
          process.exit(1);
        }

        const result = await api.searchFiles(keyword, {
          type: options.type,
          content: options.content,
        });

        if (result.status === 'success' && result.data && result.data.files) {
          if (options.json) {
            console.log(JSON.stringify(result.data.files, null, 2));
          } else {
            const showAll = options.all;
            const showSize = showAll || options.size;
            const showDate = showAll || options.date;
            const showPerm = showAll || options.perm;
            const showOwner = showAll || options.owner;

            const table = createTable(options);

            if (result.data.files.length === 0) {
              console.log("無符合結果");
            } else {
              result.data.files.forEach((file) => {
                const isDir = file.type === "dir";
                const name = isDir
                  ? `${c.dir}${file.name}${c.reset}`
                  : `${c.file}${file.name}${c.reset}`;

                const row = [name];
                if (showSize)
                  row.push(`${c.dim}${(file.size / 1024).toFixed(1)} KB${c.reset}`);
                if (showDate) row.push(`${c.dim}${file.date}${c.reset}`);
                if (showPerm) row.push(decodePermissions(getEffectivePerm(file)));
                if (showOwner) {
                  const owner = getOwner(file);
                  row.push(owner ? `${c.dim}${owner}${c.reset}` : "");
                }
                table.push(row);
              });

              console.log(table.toString());
            }
          }
        } else if (result.status === 'success' && result.data && result.data.files && result.data.files.length === 0) {
          // Empty results but success
          if (!options.json) {
            console.log("無符合結果");
          }
        } else {
          console.error(`錯誤: ${result.data ? result.data.message : "Unknown error"}`);
          process.exit(1);
        }
      } catch (err) {
        console.error("錯誤:", err.message);
        process.exit(1);
      }
    });
};