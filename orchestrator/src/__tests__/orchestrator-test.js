/* eslint-disable */

const { exec } = require('child_process');

const { Orchestrator } = require('../orchestrator');
const { Docker } = require('../docker');
const { Heartbeats } = require('../heartbeats');
const { Chain } = require('../chain');
const { getKeysFromSeed } = require('../utils');


let docker;
let chain;

let orchestrator;

let hearthbeats;

// Test configuration
const jestTimeout = 70000;

const mnemonic1 =
  'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 =
  'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 =
  'borrow initial guard hunt corn trust student opera now economy thumb argue';

// Promisify exec
const execAsync = (cmd) =>
  new Promise((resolve, reject) => {
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
  const startCommandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
  await execAsync(startCommandToExec);
  console.log('Test chain was launched...');

  // Create Docker instance
  docker = new Docker();

  // Connecting to Archipel Chain Node
  chain = new Chain('ws://127.0.0.1:9944', 'operator');
  await chain.connect();

  // Create hearthbeats instance
  hearthbeats = new Heartbeats();

  // Create Orchestrator instance
  orchestrator = new Orchestrator(
    chain,
    'polkadot',
    hearthbeats,
    mnemonic1,
    12,
    'archipel-test',
    'orchestrator',
    'operator',
    1
  );

  // Mock isServiceReadyToStart
  orchestrator.isServiceReadyToStart = () => true;
});

afterAll(async () => {
  await orchestrator.serviceCleanUp();

  if (chain && await chain.isConnected()) {
    await chain.disconnect();
  }

  // Removing test chain
  console.log('Removing test chain...');
  const stopCommandToExec = 'cd ../deployer/test/chain && ./remove.sh';
  await execAsync(stopCommandToExec);

  const volumeRemoved = await docker.pruneVolumes('validatortest-polkadot-volume');
  console.log('Docker volume removed => ' + volumeRemoved);

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
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerName} `
      )
    );
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
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerName} `
      )
    );
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
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerNamePassive} `
      )
    );
  }

  await orchestrator.serviceStart('passive');
  container = await docker.getContainer(containerNamePassive);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNameActive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerNameActive} `
      )
    );
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
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerNameActive} `
      )
    );
  }

  await orchestrator.serviceStart('active');
  container = await docker.getContainer(containerNameActive);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  try {
    container = await docker.getContainer(containerNamePassive);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(
      new Error(
        `(HTTP code 404) no such container - No such container: ${containerNamePassive} `
      )
    );
  }
});

test('No leader and no one is alive. So service remains is passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  orchestrator.heartbeats = heartbeats;

  await orchestrator.orchestrateService();

  const leaderAfter = await chain.isLeadedGroup(1);
  expect(leaderAfter).toBe(false);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.serviceCleanUp();

});

test('If service is not ready to start. Service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  const keys2 = await getKeysFromSeed(mnemonic2);
  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;
  orchestrator.isServiceReadyToStart = () => false;

  await orchestrator.orchestrateService();

  const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse2).toBe(false);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  orchestrator.isServiceReadyToStart = () => true;

  await orchestrator.serviceCleanUp();
});

test('If chain can not receive transactions. Service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  const keys2 = await getKeysFromSeed(mnemonic2);
  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;

  const canSendTransactions = orchestrator.chain.canSendTransactions;

  orchestrator.chain.canSendTransactions = () => false;

  await orchestrator.orchestrateService();

  const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse2).toBe(false);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  orchestrator.chain.canSendTransactions = canSendTransactions;

  await orchestrator.serviceCleanUp();
});


test('No leader and someone is alive. So service starts in active mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  const keys2 = await getKeysFromSeed(mnemonic2);
  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  const keys1 = await getKeysFromSeed(mnemonic1);

  const isLeadedGroupTrue = await chain.isLeadedGroup(1);
  expect(isLeadedGroupTrue).toBe(true);

  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const status= await chain.giveUpLeadership(1, mnemonic1);
  expect(status).toBe(true);
  await orchestrator.serviceCleanUp();

});

test('No leader and someone is alive but in another group (2 and not 1). Service go in active mode anyway.',  async ()  => {


  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  const keys2 = await getKeysFromSeed(mnemonic2);
  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 2, 2, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();

  const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse2).toBe(true);

  const keys1 = await getKeysFromSeed(mnemonic1);
  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const status= await chain.giveUpLeadership(1, mnemonic1);
  expect(status).toBe(true);

  await orchestrator.serviceCleanUp();

});

test('I am leader and someone is alive. So service starts in active mode.', async () => {


  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);

  const isLeadedGroupFalse = await chain.isLeadedGroup(1);
  expect(isLeadedGroupFalse).toBe(false);

  let blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;
  await orchestrator.orchestrateService();

  const isLeadedGroupTrue = await chain.isLeadedGroup(1);
  expect(isLeadedGroupTrue).toBe(true);

  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 1, blockNumber);
  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;
  await orchestrator.orchestrateService();
  const newleader = await chain.getLeader(1);
  expect(newleader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const status= await chain.giveUpLeadership(1, mnemonic1);
  expect(status).toBe(true);
  await orchestrator.serviceCleanUp();

});


test('Other node is leader and nobody is alive. No leadership change and service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const status = await chain.setLeader(keys1.address, 1, mnemonic1);
  expect(status).toBe(true);

  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic2;

  await orchestrator.orchestrateService();

  const newLeader = await chain.getLeader(1);
  expect(newLeader.toString()).toBe(keys1.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const statusClean= await chain.giveUpLeadership(1, mnemonic1);
  expect(statusClean).toBe(true);
  await orchestrator.serviceCleanUp();
});

test('Other node is leader is offline and someone other is alive. Get leadership and launch service in active mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  const status = await chain.setLeader(keys1.address, 1, mnemonic1);
  expect(status).toBe(true);
  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys3.address.toString(), 1, 1, blockNumber);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic2;
  orchestrator.noLivenessThreshold = 0;

  await orchestrator.orchestrateService();

  const newLeader = await chain.getLeader(1);
  expect(newLeader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const statusClean= await chain.giveUpLeadership(1, mnemonic2);
  expect(statusClean).toBe(true);
  await orchestrator.serviceCleanUp();
});


test('Other node is leader is offline and nobody other is alive. Do not get leadership and service remains in passive mode.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  const status = await chain.setLeader(keys2.address, 1, mnemonic2);
  expect(status).toBe(true);
  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys2.address);

  const blockNumber = await chain.getBestNumber();
  expect(blockNumber > 2 ).toBe(true);
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber - 2);
  heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber - 2);

  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;
  orchestrator.aliveTime = 1;
  orchestrator.noLivenessThreshold = 0;

  await orchestrator.orchestrateService();
  
  const newLeader = await chain.getLeader(1);
  expect(newLeader.toString()).toBe(keys2.address);

  const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  const container = await docker.getContainer(containerName);
  const containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const statusClean= await chain.giveUpLeadership(1, mnemonic2);
  expect(statusClean).toBe(true);
  await orchestrator.serviceCleanUp();

});

test('Other node is leader, someone is online and no heartbeats about leader. Threshold test.', async () => {
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  const status = await chain.setLeader(keys2.address, 1, mnemonic2);
  expect(status).toBe(true);
  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys2.address);

  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);
  orchestrator.noLivenessThreshold = 3;
  orchestrator.heartbeats = heartbeats;
  orchestrator.mnemonic = mnemonic1;

  await orchestrator.orchestrateService();
  
  const leader2 = await chain.getLeader(1);
  expect(leader2.toString()).toBe(keys2.address);

  let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  let container = await docker.getContainer(containerName);
  let containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  const leader3 = await chain.getLeader(1);
  expect(leader3.toString()).toBe(keys2.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  const leader4 = await chain.getLeader(1);
  expect(leader4.toString()).toBe(keys2.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  await orchestrator.orchestrateService();
  
  const leader5 = await chain.getLeader(1);
  expect(leader5.toString()).toBe(keys1.address);

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  //clean test
  const statusClean= await chain.giveUpLeadership(1, mnemonic1);
  expect(statusClean).toBe(true);
  await orchestrator.serviceCleanUp();
});

test('Testing serviceReadinessManagement.', async () => { 
  await orchestrator.serviceStart('passive');
  const heartbeats = new Heartbeats();

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  const status = await chain.setLeader(keys1.address, 1, mnemonic1);
  expect(status).toBe(true);
  const leader = await chain.getLeader(1);
  expect(leader.toString()).toBe(keys1.address);

  expect(orchestrator.chain.heartbeatSendEnabled).toBe(true);

  const blockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

  orchestrator.noReadyThreshold = 3;
  orchestrator.heartbeats = heartbeats;
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

  expect(orchestrator.chain.heartbeatSendEnabled).toBe(false);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.heartbeatSendEnabled).toBe(false);

  orchestrator.isServiceReadyToStart = () => true;

  // add some liveness to others nodes
  const newBlockNumber = await chain.getBestNumber();
  heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, newBlockNumber);
  heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, newBlockNumber);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.heartbeatSendEnabled).toBe(true);

  await orchestrator.orchestrateService();

  containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
  container = await docker.getContainer(containerName);
  containerInspect = await container.inspect();
  expect(containerInspect.State.Running).toBe(true);

  expect(orchestrator.chain.heartbeatSendEnabled).toBe(true);

  //clean test
  const statusClean= await chain.giveUpLeadership(1, mnemonic1);
  expect(statusClean).toBe(true);
  await orchestrator.serviceCleanUp();
});