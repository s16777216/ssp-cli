const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");
const configManager = require("../src/client/configManager");

test("module sanity checks", () => {
  const api = new SSPApi();
  assert.strictEqual(typeof api.login, "function");
  assert.strictEqual(typeof api.listFiles, "function");
  assert.strictEqual(typeof configManager.save, "function");
});
