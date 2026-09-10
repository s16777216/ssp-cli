const { c, decodePermissions, getEffectivePerm, getOwner, createTable } = require("./utils");
const configManager = require("../client/configManager");

module.exports = (program) => {
  program
    .command("ls")
    .description("List files in directory")
    .option("-d, --dir <path>", "Directory path", "/")
    .option(
      "-a, --all",
      "Show all fields (size + date + permissions + owner)",
      false,
    )
    .option("-s, --size", "Show file size", false)
    .option("-D, --date", "Show modification date", false)
    .option("-p, --perm", "Show permissions", false)
    .option("-o, --owner", "Show owner", false)
    .action(async (options) => {
      const SSPApi = require("../client/sspApi");
      const configManager = require("../client/configManager");
      
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

        // 恢復儲存的 Token 與 Cookie
        if (savedToken) api.requesttoken = savedToken;
        if (savedCookies) api.setCookieString(savedCookies);

        const result = await api.listFiles(options.dir);

        if (
          result &&
          result.status === "success" &&
          result.data &&
          result.data.files
        ) {
          const showAll = options.all;
          const showSize = showAll || options.size;
          const showDate = showAll || options.date;
          const showPerm = showAll || options.perm;
          const showOwner = showAll || options.owner;

          const table = createTable(options);

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
        } else {
          console.log("Result:", JSON.stringify(result, null, 2));
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
};