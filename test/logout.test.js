const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");
const configManager = require("../src/client/configManager");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Mock api.client.request with controllable response
function makeApiWithMockRequest(handler) {
  const api = new SSPApi();
  api.client = { request: handler || (async () => ({ status: 200, data: {} })) };
  return api;
}

// Mock configManager
function mockConfigManager() {
  const originalConfigPath = configManager.configPath;
  const testConfigPath = path.join(os.tmpdir(), `.ssp-config-test-${Date.now()}.json`);
  configManager.configPath = testConfigPath;
  return {
    restore: () => { configManager.configPath = originalConfigPath; },
    testConfigPath,
    clearTestConfig: () => { if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath); }
  };
}

test("configManager.clear() removes config file", async () => {
  const mock = mockConfigManager();
  try {
    // Create a test config file
    fs.writeFileSync(mock.testConfigPath, JSON.stringify({ username: "test", password: "test" }));
    assert.ok(fs.existsSync(mock.testConfigPath));
    
    configManager.clear();
    
    assert.strictEqual(fs.existsSync(mock.testConfigPath), false);
  } finally {
    mock.restore();
    mock.clearTestConfig();
  }
});

test("configManager.clear() is idempotent (no error if file doesn't exist)", async () => {
  const mock = mockConfigManager();
  try {
    mock.clearTestConfig(); // Ensure file doesn't exist
    
    // Should not throw
    configManager.clear();
    
    assert.ok(true); // If we get here without throwing, test passes
  } finally {
    mock.restore();
    mock.clearTestConfig();
  }
});

test("logout() returns success on 2xx", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 200, data: {} };
  });

  const result = await api.logout();

  assert.strictEqual(result.status, "success");
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].method, "POST");
  assert.strictEqual(captured[0].url, "/index.php/logout");
});

test("logout() returns error on non-2xx", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 401, data: {} }));
  const result = await api.logout();

  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /HTTP 401/);
});

test("logout() returns error on network failure", async () => {
  const api = makeApiWithMockRequest(async () => {
    const err = new Error("network error");
    err.response = { status: 500, data: "internal server error" };
    throw err;
  });

  const result = await api.logout();

  assert.strictEqual(result.status, "error");
});