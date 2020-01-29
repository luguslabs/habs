const {
  connect,
  listenEvents,
  addMetrics,
  getLeader,
  setLeader,
  getPeerNumber,
  getMetrics,
  initNonce
} = require('../chain');
const { getKeysFromSeed } = require('../utils');
const { exec } = require('child_process');
const { Metrics } = require('../metrics');

let api;
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
  const commandToExec = "cd ../deployer/test/chain/ && ./launch.sh"
  await execAsync(commandToExec);
  console.log('Test chain was launched...');

  // Connecting to Archipel Chain Node
  api = await connect('ws://127.0.0.1:9944');

  // Init all wallets nonces
  initNonce(api, mnemonic1);
  initNonce(api, mnemonic2);
  initNonce(api, mnemonic3);
});

afterAll(async () => {
  await api.disconnect();
  // Removing test chain
  console.log('Removing test chain...')
  const commandToExec = "cd ../deployer/test/chain && ./remove.sh"
  await execAsync(commandToExec);
});

test('Test add metrics and get metrics methods', async () => {
  const result = await addMetrics(api, '42', mnemonic1);
  expect(result).toBe(true);

  const keys = await getKeysFromSeed(mnemonic1);
  const metrics = await getMetrics(api, keys.address.toString());
  expect(metrics.toString()).toBe('42');
});

test('Get peers number', async () => {
  const peers = await getPeerNumber(api);
  expect(peers).toBe(2);
});

test('Set and get leader test - no leader set', async () => {
  const leader = await getLeader(api);
  expect(leader.toString()).toBe('');

  const keys = await getKeysFromSeed(mnemonic1);
  const status = await setLeader(api, keys.address, mnemonic1);
  expect(status).toBe(true);

  const newLeader = await getLeader(api);
  expect(newLeader.toString()).toBe(keys.address);
});

test('Get and set leader - leader is already set', async () => {
  const leader = await getLeader(api);
  const keys = await getKeysFromSeed(mnemonic1);
  expect(leader.toString()).toBe(keys.address);

  const status = await setLeader(api, keys.address, mnemonic2);
  expect(status).toBe(true);

  const newLeader = await getLeader(api);
  const keysNew = await getKeysFromSeed(mnemonic2);
  expect(newLeader.toString()).toBe(keysNew.address);
});

test('Test event listener that updates metrics', async () => {
  const metrics = new Metrics();

  listenEvents(api, metrics);

  const result1 = await addMetrics(api, '42', mnemonic1);
  expect(result1).toBe(true);
  const result2 = await addMetrics(api, '43', mnemonic2);
  expect(result2).toBe(true);
  const result3 = await addMetrics(api, '44', mnemonic3);
  expect(result3).toBe(true);

  await new Promise((r) => setTimeout(r, 5000));

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  expect(metrics.getMetrics(keys1.address).metrics).toBe('42');
  expect(metrics.getMetrics(keys2.address).metrics).toBe('43');
  expect(metrics.getMetrics(keys3.address).metrics).toBe('44');
});
