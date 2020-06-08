/* eslint-disable */

const { exec } = require('child_process');

const { Orchestrator } = require('../orchestrator');
const { Docker } = require('../docker');
const { Metrics } = require('../metrics');
const { Chain } = require('../chain');
const { getKeysFromSeed } = require('../utils');

// Test configuration
const jestTimeout = 320000;
let docker;
let chain;
let orchestrator;
let metrics;
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

  // Create Docker instance
  docker = new Docker();

  // Connecting to Archipel Chain Node
  chain = new Chain('ws://127.0.0.1:9944', 'operator');
  await chain.connect();

  // Create metrics instance
  metrics = new Metrics();

  // Create Orchestrator instance
  orchestrator = new Orchestrator(chain, 'polkadot', metrics, mnemonic1, 60000, "archipel-test", 'operator');

  // Mock isServiceReadyToStart
  orchestrator.isServiceReadyToStart = () => true;
});

afterAll(async () => {
  await orchestrator.serviceCleanUp();

  if (chain) {
    await chain.disconnect();
  }

  // Removing test chain
  console.log('Removing test chain...');
  const commandToExec = 'cd ../deployer/test/chain && ./remove.sh';
  await execAsync(commandToExec);
});

test('Test service in passive mode start and cleanup.', async () => {
  await orchestrator.serviceStart('passive');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  let container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();

  try {
    container = await docker.getContainer(containerName);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerName} `));
  }
});

test('Test service in active mode start and cleanup.', async () => {
  await orchestrator.serviceStart('active');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  let container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();

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

  await orchestrator.serviceStart('active');
  let container = await docker.getContainer(containerNameActive);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNamePassive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNamePassive} `));
  }

  await orchestrator.serviceStart('passive');
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

  await orchestrator.serviceStart('passive');
  let container = await docker.getContainer(containerNamePassive);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNameActive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error(`(HTTP code 404) no such container - No such container: ${containerNameActive} `));
  }

  await orchestrator.serviceStart('active');
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

test('No leader and no one is alive. So service remains is passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  let leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  orchestrator.metrics = metrics;

  await orchestrator.orchestrateService();

  let leaderAfter = await chain.getLeader();
  expect(leaderAfter.toString()).toBe('');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('If service is not ready to start. Service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  let leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const keys2 = await getKeysFromSeed(mnemonic2);
  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);

  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;
  orchestrator.isServiceReadyToStart = () => false;

  await orchestrator.orchestrateService();
  leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();

  orchestrator.isServiceReadyToStart = () => true;

});

test('If chain can not receive transactions. Service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  let leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const keys2 = await getKeysFromSeed(mnemonic2);
  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);

  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  const canSendTransactions = orchestrator.chain.canSendTransactions;

  orchestrator.chain.canSendTransactions = () => false;

  await orchestrator.orchestrateService();
  leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();

  orchestrator.chain.canSendTransactions = canSendTransactions;

});

test('No leader and someone is alive. So service starts in active mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  let leader = await chain.getLeader();
  expect(leader.toString()).toBe('');

  const keys2 = await getKeysFromSeed(mnemonic2);
  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);

  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  const keys = await getKeysFromSeed(mnemonic1);
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('I am leader and someone is alive. So service starts in active mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('I am leader but no one is alive. So service remains is passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys = await getKeysFromSeed(mnemonic1);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys.address);

  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();

  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Other node is leader and nobody is alive. No leadership change and service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic2;

  await orchestrator.orchestrateService();

  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Other node is leader and is online. Service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys1.address.toString(), '42', nowTime);
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic2;

  await orchestrator.orchestrateService();
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Other node is leader is offline and someone other is alive. Get leadership and launch service in active mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys1.address.toString(), '42', nowTime - 80000);
  metrics.addMetrics(keys3.address.toString(), '42', nowTime);
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic2;

  await orchestrator.orchestrateService();

  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Other node is leader is offline and nobody other is alive. Do not get leadership and service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys2.address.toString(), '42', nowTime - 80000);
  metrics.addMetrics(keys3.address.toString(), '42', nowTime - 80000);
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Other node is leader, someone is online and no metrics about leader. Threshold test.', async () => {
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys3.address.toString(), '42', nowTime);
  orchestrator.noLivenessThreshold = 3;
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  let container = await docker.getContainer(containerName);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys2.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();
});

test('Testing serviceReadinessManagement.', async () => { 
  await orchestrator.serviceStart('passive');
  const metrics = new Metrics();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);
  let leader = await chain.getLeader();
  expect(leader.toString()).toBe(keys1.address);
  expect(orchestrator.chain.metricSendEnabled).toBe(true);

  const nowTime = new Date().getTime();
  metrics.addMetrics(keys1.address.toString(), '42', nowTime);
  metrics.addMetrics(keys2.address.toString(), '42', nowTime);
  metrics.addMetrics(keys3.address.toString(), '42', nowTime);

  orchestrator.noReadyThreshold = 3;
  orchestrator.metrics = metrics;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();

  let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  let container = await docker.getContainer(containerName);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  orchestrator.isServiceReadyToStart = () => false;

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.metricSendEnabled).toBe(false);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.metricSendEnabled).toBe(false);

  orchestrator.isServiceReadyToStart = () => true;

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.metricSendEnabled).toBe(true);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.metricSendEnabled).toBe(true);

  await orchestrator.serviceCleanUp();

});