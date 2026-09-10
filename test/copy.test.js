const test = require("node:test");
const assert = require("node:assert");
const SSPApi = require("../src/client/sspApi");

// Mock api.client.request with controllable response
function makeApiWithMockRequest(handler) {
  const api = new SSPApi();
  api.client = { request: handler || (async () => ({ status: 200, data: {} })) };
  return api;
}

test("copyFile issues WebDAV COPY with Overwrite F by default", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 201, data: {} };
  });

  const result = await api.copyFile("/Docs/src.txt", "/backup/dst.txt");

  assert.strictEqual(result.status, "success");
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].method, "COPY");
  assert.strictEqual(captured[0].url, "/remote.php/webdav/Docs/src.txt");
  assert.strictEqual(
    captured[0].headers.Destination,
    "https://ssp.mailcloud.com.tw/remote.php/webdav/backup/dst.txt",
  );
  assert.strictEqual(captured[0].headers.Overwrite, "F");
});

test("copyFile sends Overwrite T when overwrite is true", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return { status: 201, data: {} };
  });

  await api.copyFile("/a.txt", "/b.txt", { overwrite: true });
  assert.strictEqual(captured[0].headers.Overwrite, "T");
});

test("copyFile returns status exists on 412", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 412, data: {} }));
  const result = await api.copyFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "exists");
  assert.match(result.data.message, /Destination already exists/);
});

test("copyFile returns error with Source not found on 404", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 404, data: {} }));
  const result = await api.copyFile("/missing.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /Source not found/);
});

test("copyFile returns error Permission denied on 403", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 403, data: {} }));
  const result = await api.copyFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /Permission denied/);
});

test("copyFile returns error on 5xx throw", async () => {
  const api = makeApiWithMockRequest(async () => {
    const err = new Error("server exploded");
    err.response = { status: 500, data: "boom" };
    throw err;
  });
  const result = await api.copyFile("/a.txt", "/b.txt");
  assert.strictEqual(result.status, "error");
});

test("statPath identifies a file", async () => {
  const captured = [];
  const api = makeApiWithMockRequest(async (opts) => {
    captured.push(opts);
    return {
      status: 207,
      data: '<?xml version="1.0"?><D:multistatus><D:response><D:href>/remote.php/webdav/a.txt</D:href><D:propstat><D:prop><D:resourcetype/></D:prop></D:propstat></D:response></D:multistatus>',
    };
  });

  const result = await api.statPath("/a.txt");
  assert.strictEqual(result.status, "success");
  assert.strictEqual(result.data.type, "file");
  assert.strictEqual(captured[0].method, "PROPFIND");
  assert.strictEqual(captured[0].headers.Depth, "0");
});

test("statPath identifies a folder (collection)", async () => {
  const api = makeApiWithMockRequest(async () => ({
    status: 207,
    data: '<?xml version="1.0"?><D:multistatus><D:response><D:href>/remote.php/webdav/Docs/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response></D:multistatus>',
  }));

  const result = await api.statPath("/Docs");
  assert.strictEqual(result.status, "success");
  assert.strictEqual(result.data.type, "collection");
});

test("statPath identifies a collection with lowercase d: prefix (real ownCloud XML)", async () => {
  // Real ownCloud replies use xmlns:d="DAV:" (lowercase). Regression test for
  // the bug found by the real-server smoke test (regex only matched D:).
  const api = makeApiWithMockRequest(async () => ({
    status: 207,
    data: '<?xml version="1.0"?><d:multistatus xmlns:d="DAV:"><d:response><d:href>/remote.php/webdav/Docs/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat></d:response></d:multistatus>',
  }));

  const result = await api.statPath("/Docs");
  assert.strictEqual(result.status, "success");
  assert.strictEqual(result.data.type, "collection");
});

test("statPath returns error Source not found on 404", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 404, data: {} }));
  const result = await api.statPath("/missing.txt");
  assert.strictEqual(result.status, "error");
  assert.match(result.data.message, /Source not found/);
});

test("statPath returns error on other 4xx", async () => {
  const api = makeApiWithMockRequest(async () => ({ status: 403, data: {} }));
  const result = await api.statPath("/a.txt");
  assert.strictEqual(result.status, "error");
});
