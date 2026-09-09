const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");

// Mock api.client.request with controllable response
// SSPClient.request() returns res.data, so we need to return { status: 200, data: <actual_response> }
function makeApiWithMockRequest(handler) {
  const api = new SSPApi();
  api.client = { request: handler || (async () => ({ status: 200, data: { status: 'success', data: {} } })) };
  return api;
}

test("searchFiles issues AJAX GET with search keyword", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 200, data: { status: 'success', data: { files: [] } } };
  });

  const result = await api.searchFiles("report");

  assert.strictEqual(result.status, "success");
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].method, "GET");
  assert.match(captured[0].url, /search.php\?search=report/);
});

test("searchFiles URL-encodes keyword with special characters", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 200, data: { status: 'success', data: { files: [] } } };
  });

  await api.searchFiles("測試報告");

  assert.match(captured[0].url, /search=.*%E6%B8%AC%E8%A9%A6%E5%A0%B1%E5%91%8A/);
});

test("searchFiles includes type parameter when specified", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 200, data: { status: 'success', data: { files: [] } } };
  });

  await api.searchFiles("report", { type: "file" });

  assert.match(captured[0].url, /type=file/);
});

test("searchFiles includes content parameter when content search enabled", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 200, data: { status: 'success', data: { files: [] } } };
  });

  await api.searchFiles("report", { content: true });

  assert.match(captured[0].url, /content=1/);
});

test("searchFiles returns success with files array", async () => {
  const mockFiles = [
    { name: "report.pdf", type: "file", size: 1024, date: "2024-01-15", permissions: 3 },
    { name: "reports", type: "dir", size: 0, date: "2024-01-10", permissions: 7 },
  ];
  const api = makeApiWithMockRequest(async () => ({
    status: 200,
    data: { status: 'success', data: { files: mockFiles } },
  }));

  const result = await api.searchFiles("report");

  assert.strictEqual(result.status, "success");
  assert.deepStrictEqual(result.data.files, mockFiles);
});

test("searchFiles returns error on API error response", async () => {
  const api = makeApiWithMockRequest(async () => ({
    status: 200,
    data: { status: 'error', data: { message: "伺服器錯誤" } },
  }));

  const result = await api.searchFiles("report");

  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /伺服器錯誤/);
});

test("searchFiles returns error on network failure", async () => {
  const api = makeApiWithMockRequest(async () => {
    const err = new Error("network error");
    err.response = { status: 500, data: "internal server error" };
    throw err;
  });

  const result = await api.searchFiles("report");

  assert.strictEqual(result.status, "error");
});