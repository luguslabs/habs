/* eslint-disable */
const { exec } = require('child_process');
const { assert } = require('chai');

const { Orchestrator } = require('../src/orchestrator');
const { Docker } = require('../src/docker');
const { Heartbeats } = require('../src/heartbeats');
const { Chain } = require('../src/chain');
const { getKeysFromSeed } = require('../src/utils');
const { constructConfiguration } = require('../src/config');

// Variables
let docker;
let chain;
let orchestrator;
let heartbeats;

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
  nodeGroupId: 1,
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

    // Launch test chain
    console.log('Launching test chain. Can take some time...');
    const startCommandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
    await execAsync(startCommandToExec);
    console.log('Test chain was launched...');

    // Create Docker instance
    docker = new Docker();

    // Connect to Archipel Chain Node
    chain = new Chain(config.nodeWs);
    await chain.connect();

    // Create heartbeats instance
    heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

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
    const volumeRemoved = await docker.removeVolume('validatortest-polkadot-volume');
    console.log('Docker volume removed => ' + volumeRemoved);
  
  });

  it('Test service bootstrap before orchestration', async function () {
    await orchestrator.bootstrapOrchestrator();

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    await orchestrator.service.serviceCleanUp();

    const saveOrchestratorServiceStart = orchestrator.service.serviceStart;
    orchestrator.service.serviceStart = async () => false;

    try {
      await orchestrator.bootstrapOrchestrator();
    } catch (error) {
      assert.equal(error.toString(), 'Error: Unable to start service in passive mode. Please check your configuration and docker daemon.', 'check if bootstrap orchestrator throws an error if service start unsuccessful');
    }

    orchestrator.service.serviceStart = saveOrchestratorServiceStart;
    await orchestrator.service.serviceCleanUp();
  });

  it('Test passive service start and cleanup', async function() {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');
    
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');
 
    await orchestrator.service.serviceCleanUp();
  
    container = await docker.getContainer(containerName);
    assert.equal(container, false, 'check if passive service container was shutdown correctly');

    await orchestrator.service.serviceCleanUp();
  });

  it('Test active service start and cleanup', async function () {
    await orchestrator.service.serviceStart('active');

    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service container was started correctly');
  
    await orchestrator.service.serviceCleanUp();
  
    container = await docker.getContainer(containerName);
    assert.equal(container, false, 'check if active service container was shutdown correctly');

    await orchestrator.service.serviceCleanUp();
  });

  it('Test service switch from active to passive mode', async function () {
    const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  
    await orchestrator.service.serviceStart('active');
    let container = await docker.getContainer(containerNameActive);
    assert.equal(container.description.State.Running, true, 'check if active service container was started correctly');
  
    container = await docker.getContainer(containerNamePassive);
    assert.equal(container, false, 'check if passive service container is not running');

    await orchestrator.service.serviceStart('passive');
    container = await docker.getContainer(containerNamePassive);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');
  
    container = await docker.getContainer(containerNameActive);
    assert.equal(container, false, 'check if active service container was shutdown');
  
    await orchestrator.service.serviceCleanUp();
  });

  it('Test service switch from passive to active mode', async function () {
    const containerNameActive = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const containerNamePassive = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
  
    await orchestrator.service.serviceStart('passive');
    let container = await docker.getContainer(containerNamePassive);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');
  
    container = await docker.getContainer(containerNameActive);
    assert.equal(container, false, 'check if active service container was not started');

    await orchestrator.service.serviceStart('active');
    container = await docker.getContainer(containerNameActive);
    assert.equal(container.description.State.Running, true, 'check if active service container was started correctly');
  
    container = await docker.getContainer(containerNamePassive);
    assert.equal(container, false, 'check if passive service container was shutdown');

    await orchestrator.service.serviceCleanUp();
  });

  it('Test force passive services mode at startup', async function () {
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;

    // Starting active service container
    await orchestrator.service.serviceStart('active');

    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container was started in active mode');

    // Forcing orchestrator service mode to passive
    const saveServiceMode = orchestrator.serviceMode;

    orchestrator.serviceMode = 'passive';
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

    await orchestrator.orchestrateService();

    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    await orchestrator.orchestrateService();

    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();

    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    orchestrator.serviceMode = saveServiceMode;
  });

  it('Test force active services mode at startup no leader in group', async function () {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group is not leaded');

    const saveServiceMode = orchestrator.serviceMode;

    orchestrator.serviceMode = 'active';

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container was started in active mode');

    isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leadership was taken');

    console.log('Giveup leadership to cleanup...');
    const status = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    // Test if become leader gives true but the leardership was not taken
    // Possible when chain issues
    const saveBecomeLeader = orchestrator.becomeLeader;
    orchestrator.serviceMode = 'active';
    orchestrator.becomeLeader = async () => true;

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container, false, 'check if active service container was not started');

    isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group remains not leaded');

    orchestrator.becomeLeader = saveBecomeLeader;
    orchestrator.serviceMode = saveServiceMode;
  });

  it('Test force active services mode if set leadership failed', async function () {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group is not leaded');

    const saveServiceMode = orchestrator.serviceMode;
    const saveChainSetLeader = orchestrator.chain.setLeader;

    orchestrator.chain.setLeader = () => false;
    orchestrator.serviceMode = 'active';

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group remains not leaded');
  
    await orchestrator.service.serviceCleanUp();

    orchestrator.serviceMode = saveServiceMode;
    orchestrator.chain.setLeader = saveChainSetLeader;
  });

  it('Test force active services mode at startup group is already leaded by other node', async function () {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const status2 = await chain.setLeader(keys2.address, 1, mnemonic2);
    assert.equal(status2, true, 'check if set leader transaction was executed');
  
    const leader2 = await chain.getLeader(1);
    assert.equal(leader2.toString(), keys2.address, 'check if leader was set correctly');
  
    const saveServiceMode = orchestrator.serviceMode;

    orchestrator.serviceMode = 'active';

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container was started in active mode');

    isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leadership was taken');

    console.log('Giveup leadership to cleanup...');
    orchestrator.serviceMode = 'orchestrator';
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.serviceMode = saveServiceMode;
  });

  it('Test force active services mode at startup group is leaded by current node', async function () {
    // Starting passive service container
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group is not leaded');

    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys.address, 'check if leader was set correctly');
  
    const saveServiceMode = orchestrator.serviceMode;

    orchestrator.serviceMode = 'active';

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container was started in active mode');

    const keys2 = await getKeysFromSeed(mnemonic1);
    const leader2 = await chain.getLeader(1);
    assert.equal(leader2.toString(), keys2.address, 'check if leadership was not changed');

    console.log('Giveup leadership to cleanup...');
    const status2= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status2, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.serviceMode = saveServiceMode;
  });

  it('Test if no one is alive the service remains is passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
    
    const saveHeartbeats = orchestrator.heartbeats;
    orchestrator.heartbeats = heartbeats;

    await orchestrator.orchestrateService();
  
    const leaderAfter = await chain.isLeadedGroup(1);
    assert.equal(leaderAfter, false, 'check if the group remains not leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service node was started');

    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
  });

  it('Check if service is not ready to start the service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => false;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse2, false, 'check if the group remains leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service node was started');

    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;
  
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if chain can not receive transactions the service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
  
    const canSendTransactionsSave = orchestrator.chain.canSendTransactions;
  
    orchestrator.chain.canSendTransactions = () => false;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupFalse2 = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse2, false, 'check if the group remains not leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service node was started');
    
    await orchestrator.service.serviceCleanUp();

    orchestrator.chain.canSendTransactions = canSendTransactionsSave;
  });

  it('Test if no leader and someone is alive take leadership and start service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;

    const keys1 = await getKeysFromSeed(mnemonic1);

    await orchestrator.orchestrateService();

    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was correctly set on chain');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service node was started');
  
    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if leadership take transaction was executed and orchestrator must start active service but really leadership was no taken on chain', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;

    const keys1 = await getKeysFromSeed(mnemonic1);

    // We will simulate leadershipManagement function
    const saveLeadershipManagement = orchestrator.leadershipManagement;
    orchestrator.leadershipManagement = async () => true;

    await orchestrator.orchestrateService();

    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group remains not leaded');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    assert.equal(container, false, 'check if active service node was not started');
  
    console.log('Cleanup...');
    await orchestrator.service.serviceCleanUp();

    orchestrator.leadershipManagement = saveLeadershipManagement;
    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if no leader and someone is alive but in another group get leadership on your group and start service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    const keys2 = await getKeysFromSeed(mnemonic2);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 2, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
  
    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leadership was taken');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service was started');

    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if I am leader and someone is alive the service remains in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupFalse, false, 'check if the group is not leaded');
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
    await orchestrator.orchestrateService();
  
    const isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, true, 'check if the group becomes leaded');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly on chain');

    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service container was started');
  
    blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 1, blockNumber);

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
    
    await orchestrator.orchestrateService();

    const newleader = await chain.getLeader(1);
    assert.equal(newleader.toString(), keys1.address, 'check if leader remains the same');
  
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service container remains started');
  
    console.log('Giveup leadership to cleanup...');
    const status= await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(status, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('If other node is leader and nobody is alive no leadership change and service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic2;
  
    await orchestrator.orchestrateService();
  
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys1.address, 'check if leader was not changed');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if other node is leader, is offline and someone other is alive try to get leadership and launch service in active mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
    
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 1, blockNumber);

    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
    const saveNoLivenessThreshold = orchestrator.noLivenessThreshold;
  
    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic2;
    orchestrator.noLivenessThreshold = 0;
  
    await orchestrator.orchestrateService();
  
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys2.address, 'check if leadership was taken');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service was started');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
    orchestrator.noLivenessThreshold = saveNoLivenessThreshold;
  });

  it('If other node is leader, is offline and nobody other is alive do not get leadership and service remains in passive mode', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
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
  
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
    const saveAliveTime = orchestrator.aliveTime;
    const saveNoLivenessThreshold = orchestrator.noLivenessThreshold;

    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
    orchestrator.aliveTime = 1;
    orchestrator.noLivenessThreshold = 0;
  
    await orchestrator.orchestrateService();
    
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys2.address, 'check if leader was not changed');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
    orchestrator.aliveTime = saveAliveTime;
    orchestrator.noLivenessThreshold = saveNoLivenessThreshold;
  });

  it('If other node is leader, is offline and someone other is alive test threshold', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys2.address, 1, mnemonic2);
    assert.equal(status, true, 'check if set leader transaction was executed');
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys2.address, 'check if leader was set correctly');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveNoLivenessThreshold = orchestrator.noLivenessThreshold;
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.noLivenessThreshold = 3;
    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
    
    const leader2 = await chain.getLeader(1);
    assert.equal(leader2.toString(), keys2.address, 'check if leader remains the same');
  
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader3 = await chain.getLeader(1);
    assert.equal(leader3.toString(), keys2.address, 'check if leader remains the same');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader4 = await chain.getLeader(1);
    assert.equal(leader4.toString(), keys2.address, 'check if leader remains the same');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    await orchestrator.orchestrateService();
    
    const leader5 = await chain.getLeader(1);
    assert.equal(leader5.toString(), keys1.address, 'check if leadership was taken');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service was started');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.noLivenessThreshold = saveNoLivenessThreshold;
    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test if other node is leader and is alive. Staying in passive mode...', async function () {
    await orchestrator.service.serviceStart('passive');

    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);

    // Set node 2 as leader
    const status = await chain.setLeader(keys2.address, 1, mnemonic2);
    assert.equal(status, true, 'check if set leader transaction was executed');

    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys2.address, 'check if leader was set correctly');

    // Adding heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);
  
    const saveHeartbeats = orchestrator.heartbeats;
    orchestrator.heartbeats = heartbeats;

    await orchestrator.orchestrateService();
    
    const newLeader = await chain.getLeader(1);
    assert.equal(newLeader.toString(), keys2.address, 'check if leader was not changed');
  
    const containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    const container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
  });

  it('Test serviceReadinessManagement', async function () {
    await orchestrator.service.serviceStart('passive');
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const status = await chain.setLeader(keys1.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');
  
    assert.equal(orchestrator.heartbeatSendEnabled, true, 'check if chain send heartbeats is enabled');
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveNoReadyThreshold = orchestrator.noReadyThreshold;
    const saveAliveTime = orchestrator.aliveTime;
    const saveNoLivenessThreshold = orchestrator.noLivenessThreshold;
    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
  
    orchestrator.noReadyThreshold = 3;
    orchestrator.aliveTime = 12;
    orchestrator.noLivenessThreshold = 5;
    orchestrator.heartbeats = heartbeats;
    orchestrator.mnemonic = mnemonic1;
  
    await orchestrator.orchestrateService();
  
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if active service was started');
  
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => false;
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in active mode');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service passes in passive mode');
  
    assert.equal(orchestrator.heartbeatSendEnabled, false, 'check if chain send heartbeats was disabled cause service was not ready for 3 times');

    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');
  
    assert.equal(orchestrator.heartbeatSendEnabled, false, 'check if chain send heartbeats remains disabled');

    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;
  
    // add some liveness to others nodes
    const newBlockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, newBlockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, newBlockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, newBlockNumber);
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service passes in active mode cause service becomes ready');
  
    assert.equal(orchestrator.heartbeatSendEnabled, true, 'check if chain send heartbeats become enabled');
  
    await orchestrator.orchestrateService();
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in active mode');
  
    assert.equal(orchestrator.heartbeatSendEnabled, true, 'check if chain send heartbeats remains enabled');
  
    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.noReadyThreshold = saveNoReadyThreshold;
    orchestrator.aliveTime = saveAliveTime;
    orchestrator.noLivenessThreshold = saveNoLivenessThreshold;
    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Test force passive services mode if hearbeats send are disabled', async function () {
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;

    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    const blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);
  
    // Starting active service container
    await orchestrator.service.serviceStart('active');

    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container was started in active mode');

    // Disabling heartbeats send
    const saveHeartbeatsInstrance = orchestrator.heartbeats;
    const saveHeartbeatSendEnabledAdmin = orchestrator.heartbeatSendEnabledAdmin;

    orchestrator.heartbeats = heartbeats;
    orchestrator.heartbeatSendEnabledAdmin = false;

    await orchestrator.orchestrateService();

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    await orchestrator.orchestrateService();

    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');

    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();
    await orchestrator.orchestrateService();

    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service container remains in passive mode');
    
    orchestrator.heartbeats = saveHeartbeatsInstrance;
    orchestrator.heartbeatSendEnabledAdmin = saveHeartbeatSendEnabledAdmin;
  });

  it('Other node is leader and his hearbeat was long time ago', async function () {
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group is not leaded');
  
    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 1, mnemonic1);
    assert.equal(status, true, 'check if set leader transaction was executed');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys.address, 'check if leader was set correctly');

    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveHeartbeats = orchestrator.heartbeats;
    const saveAliveTime = orchestrator.aliveTime;
    const saveMnemonic = orchestrator.mnemonic;

    orchestrator.mnemonic = mnemonic2;
    orchestrator.heartbeats = heartbeats;
    orchestrator.aliveTime = 1;

    // Wait for 10 seconds to make minimum 2 blocks 
    await new Promise((resolve) => setTimeout(resolve, 12000));

    // Adding hearbeats from nodes except leader
    blockNumber = await chain.getBestNumber();

    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    await orchestrator.orchestrateService();

    const leader2 = await chain.getLeader(1);
    assert.equal(leader2.toString(), keys2.address, 'check if node 2 took leadership');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service was launched in active mode');

    console.log('Giveup leadership to cleanup...');
    const statusGiveUp = await chain.giveUpLeadership(1, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.aliveTime = saveAliveTime;
    orchestrator.mnemonic = saveMnemonic;
  });

  it('Try to orchestrate when orchestration is disabled', async function () {
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group is not leaded');

    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
    const saveorchestrationEnabled = orchestrator.orchestrationEnabled;

    orchestrator.mnemonic = mnemonic1;
    orchestrator.heartbeats = heartbeats;
    orchestrator.orchestrationEnabled = false;

    await orchestrator.orchestrateService();

    isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group remains not leaded');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');

    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
    orchestrator.orchestrationEnabled = saveorchestrationEnabled;
  });

  it('Set leadership failed on chain', async function () {
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group is not leaded');

    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
    const saveChainSetLeader = orchestrator.chain.setLeader;

    orchestrator.mnemonic = mnemonic1;
    orchestrator.heartbeats = heartbeats;
    orchestrator.chain.setLeader = () => false;

    await orchestrator.orchestrateService();

    isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group remains not leaded');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');

    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
    orchestrator.chain.setLeader = saveChainSetLeader;
  });

  it('Test orchestration with bad service mode', async function () {
    await orchestrator.service.serviceStart('passive');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if passive service container was started correctly');

    let isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group is not leaded');

    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);
  
    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    const saveHeartbeats = orchestrator.heartbeats;
    const saveMnemonic = orchestrator.mnemonic;
    const saveServiceMode = orchestrator.serviceMode;

    orchestrator.serviceMode = 'inexistant-service-mode';
    orchestrator.mnemonic = mnemonic1;
    orchestrator.heartbeats = heartbeats;
    try {
      await orchestrator.orchestrateService();
    } catch (error) {
      assert.equal(error.toString(), `Error: Wrong service mode ${orchestrator.serviceMode}...`, 'Test if orchestrator throws an error if wrong service mode');
    }

    isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, false, 'check if the group remains not leaded');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    assert.equal(container.description.State.Running, true, 'check if service remains in passive mode');

    await orchestrator.service.serviceCleanUp();

    orchestrator.heartbeats = saveHeartbeats;
    orchestrator.mnemonic = saveMnemonic;
    orchestrator.serviceMode = saveServiceMode; 
  });

  it('Test orchestrator with polkadot service and config file', async function () {
    // Set env variables
    process.env.CONFIG_FILE = 'true';
    process.env.CONFIG_FILE_PATH = './test/mock-config.json';
    process.env.NODE_ID = '1';

    // Create configuration
    const config = constructConfiguration();

    // Change only mnemonic1 to able to submit transactions
    config.mnemonic = mnemonic1;
    
    // Adding some heartbeats
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);

    let blockNumber = await chain.getBestNumber();
    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, blockNumber);
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, blockNumber);

    // Create Orchestrator instance
    const orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats);
    // Start service before orchestration
    await orchestrator.bootstrapOrchestrator();

    // Mock isServiceReadyToStart method of service
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;

    let isLeadedGroupTrue = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroupTrue, false, 'check if the group is not leaded');

    await orchestrator.orchestrateService();

    isLeadedGroup = await chain.isLeadedGroup(1);
    assert.equal(isLeadedGroup, true, 'check if the group becomes leaded');
  
    const leader = await chain.getLeader(1);
    assert.equal(leader.toString(), keys1.address, 'check if leader was set correctly');

    delete process.env.CONFIG_FILE;
    delete process.env.CONFIG_FILE_PATH;
    delete process.env.NODE_ID;
  });

});