const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");
const configManager = require("../src/client/configManager");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Mock the full client surface used by login(): get (login page), post (login), request (session verification PROPFIND)
function makeApiWithMockClient({ propfindStatus = 207, onPropfind } = {}) {
  const api = new SSPApi();

  api.client = {
    get: async () => ({
      status: 200,
      data: '<html><head></head><body><form><input type="hidden" name="requesttoken" value="mock-token-123" /></form></body></html>'
    }),
    post: async () => ({ status: 200, data: { status: "success" } }),
    request: async (opts) => {
      if (opts.method === "PROPFIND") {
        if (onPropfind) onPropfind(opts);
        if (propfindStatus >= 200 && propfindStatus < 300) {
          return { status: propfindStatus, data: "<d:multistatus/>" };
        }
        const err = new Error(`Request failed with status code ${propfindStatus}`);
        err.response = { status: propfindStatus, data: "" };
        throw err;
      }
      return { status: 200, data: {} };
    }
  };

  return api;
}

// Point configManager at a temp file and (optionally) spy on save()
function mockConfigManager() {
  const originalConfigPath = configManager.configPath;
  const originalSave = configManager.save;
  const testConfigPath = path.join(os.tmpdir(), `.ssp-config-login-test-${Date.now()}.json`);
  const savedCalls = [];
  configManager.configPath = testConfigPath;
  configManager.save = (data) => {
    savedCalls.push(data);
    originalSave(data);
  };
  return {
    restore: () => {
      configManager.configPath = originalConfigPath;
      configManager.save = originalSave;
    },
    testConfigPath,
    savedCalls,
    clearTestConfig: () => { if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath); }
  };
}

test("login() returns credentials when session verification succeeds", async () => {
  const propfindCalls = [];
  const api = makeApiWithMockClient({ onPropfind: (opts) => propfindCalls.push(opts) });

  const result = await api.login("user@example.com", "password123");

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.requesttoken, "mock-token-123");
  assert.ok(result.cookies, "cookies should be serialized");

  // Session verification PROPFIND was actually sent
  assert.strictEqual(propfindCalls.length, 1);
  assert.strictEqual(propfindCalls[0].method, "PROPFIND");
  assert.strictEqual(propfindCalls[0].url, "/remote.php/webdav/");
  assert.strictEqual(propfindCalls[0].headers["Depth"], "0");
  assert.strictEqual(propfindCalls[0].headers["requesttoken"], "mock-token-123");
});

test("login() rejects and does not save config when session verification fails (401)", async () => {
  const mock = mockConfigManager();
  try {
    const api = makeApiWithMockClient({ propfindStatus: 401 });

    await assert.rejects(
      () => api.login("user@example.com", "wrong-password"),
      /Login failed - Session verification failed/
    );

    // configManager.save must NOT have been called
    assert.strictEqual(mock.savedCalls.length, 0);
    assert.strictEqual(fs.existsSync(mock.testConfigPath), false);
  } finally {
    mock.restore();
    mock.clearTestConfig();
  }
});

test("login() rejects on verification network/request error without saving config", async () => {
  const mock = mockConfigManager();
  try {
    const api = makeApiWithMockClient({ propfindStatus: 0 }); // 0 -> non-2xx path throws
    // Force a raw network error instead of an HTTP status error
    api.client.request = async (opts) => {
      if (opts.method === "PROPFIND") throw new Error("ECONNRESET");
      return { status: 200, data: {} };
    };

    await assert.rejects(
      () => api.login("user@example.com", "password123"),
      /Login failed - Session verification failed/
    );
    assert.strictEqual(mock.savedCalls.length, 0);
  } finally {
    mock.restore();
    mock.clearTestConfig();
  }
});

test("login() preserves an existing config file when verification fails", async () => {
  const mock = mockConfigManager();
  try {
    // Pre-existing valid config
    const oldConfig = { username: "old@example.com", password: "old-pass", requesttoken: "old-token", cookies: "{}" };
    fs.writeFileSync(mock.testConfigPath, JSON.stringify(oldConfig));

    const api = makeApiWithMockClient({ propfindStatus: 403 });

    await assert.rejects(
      () => api.login("new@example.com", "new-pass"),
      /Login failed - Session verification failed/
    );

    // Original config untouched
    const after = JSON.parse(fs.readFileSync(mock.testConfigPath, "utf8"));
    assert.deepStrictEqual(after, oldConfig);
  } finally {
    mock.restore();
    mock.clearTestConfig();
  }
});