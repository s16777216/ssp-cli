const SSPApi = require('./client/sspApi');
const configManager = require('./client/configManager');
const assert = require('assert');

async function test() {
  console.log('Running basic module verification...');
  const api = new SSPApi();
  assert.strictEqual(typeof api.login, 'function');
  assert.strictEqual(typeof api.listFiles, 'function');
  assert.strictEqual(typeof configManager.save, 'function');
  console.log('All module sanity checks passed successfully!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
