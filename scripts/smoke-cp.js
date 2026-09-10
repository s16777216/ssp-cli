#!/usr/bin/env node
/**
 * Real-server smoke test for the `cp` command.
 *
 * Uses credentials already stored in ~/.ssp-config.json (does NOT print them,
 * does NOT re-login, does NOT modify the stored config).
 *
 * Works inside a dedicated test directory /SmokeTest_cp/ and cleans up after
 * itself. Safe to run against a real Mailcloud account — only the test
 * directory is touched.
 *
 * NOT wired into `npm test` (requires a live server + valid session).
 * Run manually:
 *   node scripts/smoke-cp.js
 */

const SSPApi = require("../src/client/sspApi");
const configManager = require("../src/client/configManager");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Mirror all output to a UTF-8 log file (avoids PowerShell encoding issues)
const LOG_PATH = process.env.SMOKE_LOG || path.join(os.tmpdir(), "smoke-cp.log");
const outLines = [];
function log(line) {
  outLines.push(line);
  process.stdout.write(line + "\n");
}
function flushLog() {
  try {
    const raw = fs.readFileSync(LOG_PATH, "utf8");
    fs.writeFileSync(LOG_PATH, raw + "\n[re-run]\n" + outLines.join("\n"), "utf8");
  } catch (e) {
    fs.writeFileSync(LOG_PATH, outLines.join("\n"), "utf8");
  }
}

const TEST_DIR = "/SmokeTest_cp";
const TEST_FILE = `${TEST_DIR}/source-file.txt`;
const COPIED_FILE = `${TEST_DIR}/copied-file.txt`;
const TEST_SUBDIR = `${TEST_DIR}/src-folder`;
const TEST_SUBFILE = `${TEST_SUBDIR}/nested.txt`;
const COPIED_DIR = `${TEST_DIR}/copied-folder`;

let passed = 0;
let failed = 0;

function ok(cond, label, detail) {
  if (cond) {
    passed++;
    log(`  [PASS] ${label}`);
  } else {
    failed++;
    log(`  [FAIL] ${label}`);
    if (detail !== undefined) {
      log(`          detail: ${JSON.stringify(detail)}`);
    }
  }
}

function section(title) {
  log(`\n== ${title} ==`);
}

async function main() {
  const api = new SSPApi();

  // Load stored session (cookies + token) WITHOUT printing credentials
  const savedToken = configManager.get("requesttoken");
  const savedCookies = configManager.get("cookies");
  const username = configManager.get("username");

  if (!savedCookies || !username) {
    log("No stored session found. Run `ssp login -u <user> -p <pass>` first.");
    process.exit(1);
  }
  if (savedToken) api.requesttoken = savedToken;
  api.setCookieString(savedCookies);
  log(`Using stored session for: ${username}`);

  section("Setup: build source fixture");
  await api.createFolder(TEST_DIR);
  await api.createFolder(TEST_SUBDIR);
  await api.uploadFile(
    testLocalFile(),
    TEST_FILE,
  );
  await api.uploadFile(
    testLocalFile(),
    TEST_SUBFILE,
  );
  log("  [PASS] test fixture created");

  try {
    section("1. statPath: file vs folder detection");
    const statFile = await api.statPath(TEST_FILE);
    ok(statFile.status === "success" && statFile.data.type === "file",
      `statPath(${TEST_FILE}) → file`, statFile);
    const statDir = await api.statPath(TEST_DIR);
    ok(statDir.status === "success" && statDir.data.type === "collection",
      `statPath(${TEST_DIR}) → collection`, statDir);

    section("2. copyFile: file copy (server-side)");
    const copyRes = await api.copyFile(TEST_FILE, COPIED_FILE);
    ok(copyRes.status === "success", `copyFile file → success`, copyRes);
    const statCopied = await api.statPath(COPIED_FILE);
    ok(statCopied.status === "success" && statCopied.data.type === "file",
      `copied file exists as file`, statCopied);

    section("3. copyFile: 412 when target already exists");
    const dupRes = await api.copyFile(TEST_FILE, COPIED_FILE);
    ok(dupRes.status === "exists", `duplicate copy → status 'exists' (412)`, dupRes);

    section("4. copyFile overwrite: overwrite an existing target");
    const owRes = await api.copyFile(TEST_FILE, COPIED_FILE, { overwrite: true });
    ok(owRes.status === "success", `overwrite copy → success`, owRes);

    section("5. copyFile -r: recursive folder copy (server-side, no Depth header)");
    const dirRes = await api.copyFile(TEST_SUBDIR, COPIED_DIR);
    ok(dirRes.status === "success", `copyFile folder → success (server-side recursion)`, dirRes);
    const statCopiedNested = await api.statPath(`${COPIED_DIR}/nested.txt`);
    ok(statCopiedNested.status === "success" && statCopiedNested.data.type === "file",
      `nested file present in copied folder (recursion works)`, statCopiedNested);

    section("6. source not found (cp flow: statPath intercepts before copy)");
    const missingStat = await api.statPath(`${TEST_DIR}/does-not-exist.txt`);
    ok(missingStat.status === "error" && /Source not found/.test(missingStat.data.message),
      `statPath(missing) → error Source not found`, missingStat);
  } finally {
    // Cleanup: delete the smoke-test directory, then verify via statPath it is gone.
    section("Cleanup: remove smoke test directory");
    await api.deleteFile("/", "SmokeTest_cp");
    const gone = await api.statPath(TEST_DIR);
    ok(gone.status === "error" && gone.data.code === 404,
      `delete ${TEST_DIR} → verified removed (statPath 404)`, gone);
  }

  flushLog();
  log(`\n=== SMOKE RESULT: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

function testLocalFile() {
  const filePath = path.join(os.tmpdir(), "ssp-smoke-cp.txt");
  fs.writeFileSync(filePath, `smoke test ${Date.now()}\n`);
  return filePath;
}

main().catch((err) => {
  log("Smoke test crashed: " + err.message);
  flushLog();
  process.exit(1);
});
