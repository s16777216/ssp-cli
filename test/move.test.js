const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");

// Mock api.client.request with controllable response
function makeApiWithMockRequest(handler) {
  const api = new SSPApi();
  api.client = { request: handler || (async () => ({ status: 200, data: {} })) };
  return api;
}

test("moveFile issues WebDAV MOVE with Overwrite F by default", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 201, data: {} };
  });

  const result = await api.moveFile("/Docs/src.txt", "/backup/dst.txt");

  assert.strictEqual(result.status, "success");
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].method, "MOVE");
  assert.strictEqual(captured[0].url, "/remote.php/webdav/Docs/src.txt");
  assert.strictEqual(
    captured[0].headers.Destination,
    "https://ssp.mailcloud.com.tw/remote.php/webdav/backup/dst.txt",
  );
  assert.strictEqual(captured[0].headers.Overwrite, "F");
});

test("moveFile sends Overwrite T when overwrite is true", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 201, data: {} };
  });

  await api.moveFile("/a.txt", "/b.txt", { overwrite: true });
  assert.strictEqual(captured[0].headers.Overwrite, "T");
});

test("moveFile returns status exists on 412", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 412, data: {} }));
  const result = await api.moveFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "exists");
  assert.match(result.data.message, /Destination already exists/);
});

test("moveFile returns error with Source not found on 404", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 404, data: {} }));
  const result = await api.moveFile("/missing.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /Source not found/);
});

test("moveFile returns error Permission denied on 403", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 403, data: {} }));
  const result = await api.moveFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /Permission denied/);
});

test("moveFile returns cross-fs on 409 (cross-filesystem not supported)", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 409, data: {} }));
  const result = await api.moveFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "cross-fs");
  assert.match(result.data.message, /Cross-storage move not supported/);
});

test("moveFile returns cross-fs on 501 (cross-filesystem not supported)", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 501, data: {} }));
  const result = await api.moveFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "cross-fs");
  assert.match(result.data.message, /Cross-storage move not supported/);
});

test("moveFile returns error on 5xx throw", async () => {
  const api = makeApiWithMockRequest(async () => {
    const err = new Error("server exploded");
    err.response = { status: 500, data: "boom" };
    throw err;
  });
  const result = await api.moveFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
});