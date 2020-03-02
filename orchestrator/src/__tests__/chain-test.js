/* eslint-disable */

const { exec } = require('child_process');

const { Chain } = require('../chain');
const { getKeysFromSeed } = require('../utils');
const { Metrics } = require('../metrics');

// Test configuration
let chain;
const jestTimeout = 60000;
const mnemonic1 = 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 = 'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 = 'borrow initial guard hunt corn trust student opera now economy thumb argue';

// Promisify exec
const execAsync = cmd => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      reject(Error(stdout + stderr));
    }
    resolve(stdout + stderr);
  });
});

beforeAll(async () => {
  // Set jest callback timeout
  jest.setTimeout(jestTimeout);

  // Launching test chain
  console.log('Launching test chain. Can take some time...');
  const commandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
  await execAsync(commandToExec);
  console.log('Test chain was launched...');

  // Connecting to Archipel Chain Node
  chain = new Chain('ws://127.0.0.1:9944');
  await chain.connect();
});

afterAll(async () => {
  await chain.disconnect();
  // Removing test chain
  console.log('Removing test chain...');
  const commandToExec = 'cd ../deployer/test/chain && ./remove.sh';
  await execAsync(commandToExec);
});

test('Test add metrics and get metrics methods', async () => {
  const result = await chain.addMetrics('42', mnemonic1);
  expect(result).toBe(true);

  const keys = await getKeysFromSeed(mnemonic1);
  const metrics = await chain.getMetrics(keys.address.toString());
  expect(metrics.toString()).toBe('42');
});

test('Get peers number', async () => {
  const peers = await chain.getPeerNumber();
  expect(peers).toBe(2);
});

test('Set and get leader test - no leader set', async () => {
  const leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const keys = await getKeysFromSeed(mnemonic1);
  const status = await chain.setLeader(keys.address, mnemonic1);
  expect(status).toBe(true);

  const newLeader = await chain.getLeader();
  expect(newLeader.toString()).toBe(keys.address);
});

test('Get and set leader - leader is already set', async () => {
  const leader = await chain.getLeader();
  const keys = await getKeysFromSeed(mnemonic1);
  expect(leader.toString()).toBe(keys.address);

  const status = await chain.setLeader(keys.address, mnemonic2);
  expect(status).toBe(true);

  const newLeader = await chain.getLeader();
  const keysNew = await getKeysFromSeed(mnemonic2);
  expect(newLeader.toString()).toBe(keysNew.address);
});

test('Test event listener that updates metrics', async () => {
  const metrics = new Metrics();
  const orchestrator = { serviceStart: function () {} };

  chain.listenEvents(metrics, orchestrator, mnemonic1);

  const result1 = await chain.addMetrics('42', mnemonic1);
  expect(result1).toBe(true);
  const result2 = await chain.addMetrics('43', mnemonic2);
  expect(result2).toBe(true);
  const result3 = await chain.addMetrics('44', mnemonic3);
  expect(result3).toBe(true);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  expect(metrics.getMetrics(keys1.address).metrics).toBe('42');
  expect(metrics.getMetrics(keys2.address).metrics).toBe('43');
  expect(metrics.getMetrics(keys3.address).metrics).toBe('44');
});
