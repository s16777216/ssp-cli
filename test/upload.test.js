const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SSPApi = require("../src/client/sspApi");

function makeApiWithMockRequest(capturedUrls) {
  const api = new SSPApi();
  api.client = {
    request: async (opts) => {
      capturedUrls.push(opts.url);
      return { status: 200, data: {} };
    },
  };
  return api;
}

function makeTempFile(filename) {
  const filePath = path.join(os.tmpdir(), filename);
  fs.writeFileSync(filePath, "test content for upload");
  return filePath;
}

test("uploadFile appends local basename when target is a directory", async () => {
  const capturedUrls = [];
  const api = makeApiWithMockRequest(capturedUrls);
  const localPath = makeTempFile("upload-src-local.txt");

  try {
    const result = await api.uploadFile(localPath, "/Docs/");
    assert.strictEqual(result.status, "success");
    assert.strictEqual(capturedUrls.length, 1);
    assert.strictEqual(capturedUrls[0], "/remote.php/webdav/Docs/upload-src-local.txt");
  } finally {
    fs.unlinkSync(localPath);
  }
});

test("uploadFile keeps full remote path when a file path is given", async () => {
  const capturedUrls = [];
  const api = makeApiWithMockRequest(capturedUrls);
  const localPath = makeTempFile("upload-src-map.txt");

  try {
    const result = await api.uploadFile(localPath, "/remote/renamed.txt");
    assert.strictEqual(result.status, "success");
    assert.strictEqual(capturedUrls.length, 1);
    assert.strictEqual(capturedUrls[0], "/remote.php/webdav/remote/renamed.txt");
  } finally {
    fs.unlinkSync(localPath);
  }
});
