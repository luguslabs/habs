/* eslint-disable */
const { exec } = require('child_process');
const { assert } = require('chai');

const { Orchestrator } = require('../src/orchestrator');
const { Docker } = require('../src/docker');
const { Heartbeats } = require('../src/heartbeats');
const { Chain } = require('../src/chain');
const { getKeysFromSeed } = require('../src/utils');
const { isTestChain } = require('@polkadot/util');

// Variables
let docker;
let chain;
let orchestrator;
let heartbeats;

// Set env variables
process.env.POLKADOT_NAME = 'validator-test';
process.env.POLKADOT_PREFIX = 'validatortest-';
process.env.POLKADOT_IMAGE = 'parity/polkadot:latest';
process.env.POLKADOT_KEY_GRAN = 'april shift pupil quit mandate school cost oven gospel castle brain student';
process.env.POLKADOT_KEY_BABE = 'region run sunset rule light gap cool element angle example laundry stadium';
process.env.POLKADOT_KEY_IMON = 'screen sustain clog husband assist noble artist sea fringe afford coil hawk';
process.env.POLKADOT_KEY_PARA = 'produce hover hurdle lobster december slight hat note quit bomb drama notice';
process.env.POLKADOT_KEY_ASGN = 'rough open marine belt rib violin december gesture word fall catalog side';
process.env.POLKADOT_KEY_AUDI = 'oak tail stomach fluid trade aunt fire fringe mercy roast style garlic';
process.env.POLKADOT_ADDITIONAL_OPTIONS = '--chain kusama --db-cache 512';
process.env.TESTING = true;

// Test configuration
const testTimeout = 360000;
const mnemonic1 =
  'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 =
  'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 =
  'borrow initial guard hunt corn trust student opera now economy thumb argue';
const nodesWallets = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'
const archipelName = 'test-archipel';
// Construct config
const config = {
  nodeWs: 'ws://127.0.0.1:9944',
  heartbeatEnabled: true,
  orchestrationEnabled: true,
  mnemonic: mnemonic1,
  nodeGroupId: '1',
  nodesWallets: nodesWallets, 
  archipelName: archipelName,
  aliveTime: 12,
  service: 'polkadot',
  serviceMode: 'orchestrator',
  nodesWallets: nodesWallets,
  archipelName: archipelName
};

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

describe('Orchestrator test', function() {
  this.timeout(testTimeout);

  before(async function() {
    // Launch test chain
    console.log('Launching test chain. Can take some time...');
    const startCommandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
    await execAsync(startCommandToExec);
    console.log('Test chain was launched...');

    // Create Docker instance
    docker = new Docker();

    // Connect to Archipel Chain Node
    chain = new Chain(config);
    await chain.connect();

    // Create heartbeats instance
    heartbeats = new Heartbeats(config);

    // Create Orchestrator instance
    orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats);

    // Mock isServiceReadyToStart method of service
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;
  });

  after(async function() {
    // Remove service containers
    await orchestrator.service.serviceCleanUp();

    // Disconnect from test chain
    if (chain && await chain.isConnected()) {
      await chain.disconnect();
    }
  
    // Remove test chain
    console.log('Removing test chain...');
    const stopCommandToExec = 'cd ../deployer/test/chain && ./remove.sh';
    await execAsync(stopCommandToExec);
  
    // Remove created volumes
    const volumeRemoved = await docker.pruneVolumes('validatortest-polkadot-volume');
    console.log('Docker volume removed => ' + volumeRemoved);
  
  });

  it('Test passive service start and cleanup', async function() {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');
    
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

    let container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();

    assert.equal(containerInspect.State.Running, true, 'check if passive service container was started correctly');
 
    // Cleaning up service
    await orchestrator.service.serviceCleanUp();
  
    try {
      container = await docker.getContainer(containerName);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerName} `, 'check if passive service container was shutdown correctly');
    }

    await orchestrator.service.serviceCleanUp();
  });

  it('Test active service start and cleanup', async function () {
    await orchestrator.service.serviceStart('active');

    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();

    assert.equal(containerInspect.State.Running, true, 'check if active service container was started correctly');
  
    await orchestrator.service.serviceCleanUp();
  
    try {
      container = await docker.getContainer(containerName);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerName} `, 'check if active service container was shutdown correctly');
    }

    await orchestrator.service.serviceCleanUp();
  });

  it('Test service switch from active to passive mode', async function () {
    const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  
    await orchestrator.service.serviceStart('active');
    let container = await docker.getContainer(containerNameActive);
    let containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service container was started correctly');
  
    try {
      container = await docker.getContainer(containerNamePassive);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerNamePassive} `, 'check if passive service container is not running');
    }
  
    await orchestrator.service.serviceStart('passive');
    container = await docker.getContainer(containerNamePassive);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if passive service container was started correctly');
  
    try {
      container = await docker.getContainer(containerNameActive);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerNameActive} `, 'check if active service container was shutdown');
    }

    await orchestrator.service.serviceCleanUp();
  });

  it('Test service switch from passive to active mode', async function () {
    const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  
    await orchestrator.service.serviceStart('passive');
    let container = await docker.getContainer(containerNamePassive);
    let containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if passive service container was started correctly');
  
    try {
      container = await docker.getContainer(containerNameActive);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerNameActive} `, 'check if active service container was not started');
    }
  
    await orchestrator.service.serviceStart('active');
    container = await docker.getContainer(containerNameActive);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service container was started correctly');
  
    try {
      container = await docker.getContainer(containerNamePassive);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), `Error: (HTTP code 404) no such container - No such container: ${containerNamePassive} `, 'check if passive service container was shutdown');
    }

    await orchestrator.service.serviceCleanUp();
  });

  it('Test if no one is alive the service remains is passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
    
    orchestrator.heartbeats = heartbeats;

    await orchestrator.orchestrateService();
  
    const leaderAfter = await chain.isLeadedGroup(1);
    assert.equal(leaderAfter, false, 'check if the group remains not leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if passive service node was started');

    await orchestrator.service.serviceCleanUp();
  });

  it('Check if service is not ready to start the service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => false;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse2, false, 'check if the group remains leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if passive service node was started');

    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;
  
    await orchestrator.service.serviceCleanUp();
  });

  it('Test if chain can not receive transactions the service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
  
    const canSendTransactions = orchestrator.chain.canSendTransactions;
  
    orchestrator.chain.canSendTransactions = () => false;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse2, false, 'check if the group remains not leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if passive service node was started');
  
    orchestrator.chain.canSendTransactions = canSendTransactions;
  
    await orchestrator.service.serviceCleanUp();
  });

  it('Test if no leader and someone is alive take leadership and start service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
    const keys1 = await getKeysFromSeed(mnemonic1);

    await orchestrator.orchestrateService();

    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was correctly set on chain');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service node was started');
  
    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('Test if no leader and someone is alive but in another group get leadership on your group and start service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 2, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leadership was taken');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service was started');

    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('Test if i am leader and someone is alive the service remains in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
    await orchestrator.orchestrateService();
  
    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly on chain');

    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    let containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service container was started');
  
    blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 1, blockNumber);
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
    await orchestrator.orchestrateService();

    const newleader = await chain.getLeader(1);
    assert.equal(newleader.toString(), keys1.address, 'check if leader remains the same');
  
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service container remains started');
  
    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('If other node is leader and nobody is alive no leadership change and service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic2;
  
    await orchestrator.orchestrateService();
  
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys1.address, 'check if leader was not changed');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('Test if other node is leader, is offline and someone other is alive try to get leadership and launch service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
    
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 1, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic2;
    orchestrator.noLivenessThreshold = 0;
  
    await orchestrator.orchestrateService();
  
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys2.address, 'check if leadership was taken');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service was started');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('If other node is leader, is offline and nobody other is alive do not get leadership and service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys2.address, 1, mnemonic2);
    assert.equal(status, true, 'check if set leader transaction was executed');

    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys2.address, 'check if leader was set correctly');
  
    const blockNumber = await chain.getBestNumber();
    assert.equal(blockNumber > 2, true, 'check if blocknumber is more than 2');

    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber - 2);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber - 2);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
    orchestrator.aliveTime = 1;
    orchestrator.noLivenessThreshold = 0;
  
    await orchestrator.orchestrateService();
    
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys2.address, 'check if leader was not changed');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    const containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('If other node is leader, is offline and someone other is alive test threshold', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys2.address, 1, mnemonic2);
    assert.equal(status, true, 'check if set leader transaction was executed');
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys2.address, 'check if leader was set correctly');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    orchestrator.noLivenessThreshold = 3;
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
    
    const leader2 = await chain.getLeader(1);
    assert.equal(leader2.toString(), keys2.address, 'check if leader remains the same');
  
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    let containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader3 = await chain.getLeader(1);
    assert.equal(leader3.toString(), keys2.address, 'check if leader remains the same');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader4 = await chain.getLeader(1);
    assert.equal(leader4.toString(), keys2.address, 'check if leader remains the same');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader5 = await chain.getLeader(1);
    assert.equal(leader5.toString(), keys1.address, 'check if leadership was taken');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service was started');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

  it('Test serviceReadinessManagement', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    assert.equal(orchestrator.chain.heartbeatSendEnabled, true, 'check if chain send heartbeats is enabled');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);
  
    orchestrator.service.noReadyThreshold = 3;
    orchestrator.aliveTime = 12;
    orchestrator.noLivenessThreshold = 5;
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
  
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    let containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if active service was started');
  
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => false;
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service passes in passive mode');
  
    assert.equal(orchestrator.chain.heartbeatSendEnabled, false, 'check if chain send heartbeats was disabled cause service was not ready for 3 times');

    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in passive mode');
  
    assert.equal(orchestrator.chain.heartbeatSendEnabled, false, 'check if chain send heartbeats remains disabled');

    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;
  
    // add some liveness to others nodes
    const newBlockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, newBlockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, newBlockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, newBlockNumber);
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service passes in active mode cause service becomes ready');
  
    assert.equal(orchestrator.chain.heartbeatSendEnabled, true, 'check if chain send heartbeats become enabled');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    containerInspect = await container.inspect();
    assert.equal(containerInspect.State.Running, true, 'check if service remains in active mode');
  
    assert.equal(orchestrator.chain.heartbeatSendEnabled, true, 'check if chain send heartbeats remains enabled');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();
  });

});