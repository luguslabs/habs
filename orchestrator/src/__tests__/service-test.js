const { orchestrateService, serviceStart, serviceCleanUp } = require('../service');
const Docker = require('dockerode');
const { Metrics } = require('../metrics');
const { connect, getLeader, initNonce } = require('../chain');
const { getKeysFromSeed } = require('../utils');
const { exec } = require('child_process');

const jestTimeout = 320000;
let docker;
let api;
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

  // Creating Docker instance
  docker = new Docker({ socketPath: '/var/run/docker.sock' });

  // Connecting to Archipel Chain Node
  api = await connect('ws://127.0.0.1:9944');

  // Init all wallets nonces
  initNonce(api, mnemonic1);
  initNonce(api, mnemonic2);
  initNonce(api, mnemonic3);
});

afterAll(async () => {
  await serviceCleanUp(docker, 'polkadot');
  
  await api.disconnect();
  // Removing test chain
  console.log('Removing test chain...')
  const commandToExec = "cd ../deployer/test/chain && ./remove.sh"
  await execAsync(commandToExec);
});

test('Test service in passive mode start and cleanup.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  let container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');

  try {
    container = await docker.getContainer(containerName);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerName} `));
  }
});

test('Test service in active mode start and cleanup.', async () => {
  await serviceStart(docker, 'polkadot', 'active');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  let container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');

  try {
    container = await docker.getContainer(containerName);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerName} `));
  }
});

test('Test service switch active -> passive mode.', async () => {
  const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

  await serviceStart(docker, 'polkadot', 'active');
  let container = await docker.getContainer(containerNameActive);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNamePassive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNamePassive} `));
  }

  await serviceStart(docker, 'polkadot', 'passive');
  container = await docker.getContainer(containerNamePassive);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNameActive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNameActive} `));
  }
});

test('Test service switch passive -> active mode.', async () => {
  const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

  await serviceStart(docker, 'polkadot', 'passive');
  let container = await docker.getContainer(containerNamePassive);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNameActive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNameActive} `));
  }

  await serviceStart(docker, 'polkadot', 'active');
  container = await docker.getContainer(containerNameActive);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNamePassive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNamePassive} `));
  }
});

test('Test orchestrate service. Become leader and service remains in passive mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  let leader = await getLeader(api);
  expect(leader.toString()).toBe('');

  await orchestrateService(docker, api, metrics, mnemonic1, 60000, 'polkadot');
  const keys = await getKeysFromSeed(mnemonic1);
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});

test('Test orchestrate service. I am leader but no one is online. So service remains passive mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  const keys = await getKeysFromSeed(mnemonic1);
  let leader = await getLeader(api);
  expect(leader.toString()).toBe(keys.address);

  await orchestrateService(docker, api, metrics, mnemonic1, 60000, 'polkadot');
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});

test('Test orchestrate service. I am leader and someone is online. Launch service in active mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  let leader = await getLeader(api);
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);
  await orchestrateService(docker, api, metrics, mnemonic1, 60000, 'polkadot');
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});

test('Test orchestrate service. Other node is leader and is online. Service remains in passive mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  let leader = await getLeader(api);
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys1.address.toString(), '42', nowTime);
  await orchestrateService(docker, api, metrics, mnemonic2, 60000, 'polkadot');
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});

test('Test orchestrate service. Other node is leader and no one other is online. Get leadership but service remains in passive mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  let leader = await getLeader(api);
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys1.address.toString(), '42', nowTime-80000);
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);
  await orchestrateService(docker, api, metrics, mnemonic2, 60000, 'polkadot');
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});

test('Test orchestrate service. Other node is leader and someone is online. Get leadership and launch service in active mode.', async () => {
  await serviceStart(docker, 'polkadot', 'passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);
  let leader = await getLeader(api);
  expect(leader.toString()).toBe(keys2.address);

  const nowTime = new Date().getTime(); 
  metrics.addMetrics(keys1.address.toString(), '42', nowTime-80000);
  metrics.addMetrics(keys3.address.toString(), '42', nowTime);
  await orchestrateService(docker, api, metrics, mnemonic2, 60000, 'polkadot');
  leader = await getLeader(api);
  expect(leader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await serviceCleanUp(docker, 'polkadot');
});
