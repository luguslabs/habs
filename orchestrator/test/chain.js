/* eslint-disable */
const { exec } = require('child_process');
const { assert } = require('chai');
const { Chain } = require('../src/chain');
const { getKeysFromSeed, constructNodesList } = require('../src/utils');
const { Heartbeats } = require('../src/heartbeats');
const { assertReturn } = require('@polkadot/util');

// Test configuration
let chain;
let heartbeats;
const testTimeout = 120000;
const mnemonic1 = 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 = 'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 = 'borrow initial guard hunt corn trust student opera now economy thumb argue';
const nodesWallets = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'
const archipelName = 'test-archipel';

// Promisify exec
const execAsync = cmd => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      reject(Error(stdout + stderr));
    }
    resolve(stdout + stderr);
  });
});

describe('Archipel chain test', function () {
  this.timeout(testTimeout);

  before(async () => {
    // Launch test chain
    console.log('Launching test chain. Can take some time...');
    const commandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
    await execAsync(commandToExec);
    console.log('Test chain was launched...');

    // Connect to Archipel Chain Node
    console.log('Connection to chain...');
    const config = {
      nodeWs: 'ws://127.0.0.1:9944',
      heartbeatEnabled: true,
      mnemonic: mnemonic1,
      nodeGroupId: '1'
    };
    const heartbeatAddInterval = 5000;
    const chainInfoUpdateInterval = 5000;
    // Create Heartbeats instance
    heartbeats = new Heartbeats(nodesWallets, archipelName);
    chain = new Chain(config.nodeWs, heartbeats, config.nodeGroupId, config.mnemonic, heartbeatAddInterval, chainInfoUpdateInterval);
    await chain.connect();

    // We will grow up lastBlockThreshold for all transactions to pass in testing suite
    chain.lastBlockThreshold = 500;
  });

  after(async () => {
    // Wait for 5 seconds to be sure that everything is finished
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (chain) {
      await chain.disconnect();
    }
    // Removing test chain
    console.log('Removing test chain...');
    const commandToExec = 'cd ../deployer/test/chain && ./remove.sh';
    await execAsync(commandToExec);
  });

  it('Test if chain is working correctly', async () => {
    // Check chain connection
    chainConnected = await chain.isConnected();
    assert.equal(chainConnected, true, 'check if chain is connected');
    const peerId = await chain.getPeerId();
    assert.notEqual(peerId, false, 'check if local peer id is set');

    // Wait for 5 seconds and see if chain is working
    await new Promise(resolve => setTimeout(resolve, 5000));
    const bestNumber = await chain.getBestNumber();
    assert.isAbove(parseInt(bestNumber), 0, 'check if blocks are created');
  });

  it('Test disconnect function', async () => {
    let isConnected = chain.isConnected();
    assert.equal(isConnected, true, 'Check if connected to chain');

    // Disconnecting from chain
    let disconnect = await chain.disconnect();
    assert.equal(disconnect, true, 'Check if disconnect returns true');

    await new Promise((resolve) => setTimeout(resolve, 5000));
  
    disconnect = await chain.disconnect();
    assert.equal(disconnect, false, 'Check if disconnect returns false cause already disconnected');

    isConnected = chain.isConnected();
    assert.equal(isConnected, false, 'Check if not connected to chain');

    // Reconnecting to chain
    await chain.connect();
  });

  it('Test chain bootstrap function', async () => {
    await chain.disconnect();

    const orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: (mode) => {}
    }

    await chain.bootstrap(orchestratorMock);

    let isConnected = chain.isConnected();
    assert.equal(isConnected, true, 'Check if connected to chain');

    assert.notEqual(chain.heartbeatTimer, false, 'Check if heartbeat timer was set');
    assert.notEqual(chain.chainInfoTimer, false, 'Check if update info timer was set');

    // Test if heartbeat send was bootstrapped
    await new Promise(resolve => setTimeout(resolve, 15000));
    const keys = await getKeysFromSeed(mnemonic1);
    const chainHeartbeat = await chain.getHeartbeat(keys.address.toString());
    assert.notEqual(chainHeartbeat, 0, 'check if heartbeat was sent by heartbeat timer');

    let heartbeat = heartbeats.getHeartbeat(keys.address.toString());
    assert.isAbove(heartbeat.blockNumber, 0, 'check if heartbeat was set by event listener');

    // Check if chain info updater was bootstrapped
    let blockNumber = chain.bestBlockNumber;
    await new Promise(resolve => setTimeout(resolve, 15000));
    assert.isAbove(chain.bestBlockNumber, blockNumber, 'check if heartbeat was set by event listener');

    await chain.shutdown();
    // Reconnecting to chain
    await chain.connect();
  });

  it.only('Test chain bootstrap errors', async () => {
    await chain.disconnect();

    let orchestratorMock = {
      heartbeatSendEnabled: false,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: (mode) => {}
    }

    await chain.bootstrap(orchestratorMock);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await chain.shutdown();

    orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: false,
      getServiceMode: () => 1,
      serviceStart: (mode) => {}
    }
    await chain.bootstrap(orchestratorMock);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await chain.shutdown();
    await new Promise(resolve => setTimeout(resolve, 5000));

    /*
    const saveHeartbeatAdd = chain.addHeartbeat;

    chain.addHeartbeat = async () => {
      throw Error("Error");
    };

    orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: (mode) => {}
    }

    try {
      await chain.bootstrap(orchestratorMock);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      assert.equal(error.toString(), 'Error: Error', 'See if boostrap throws an error');
    }

    await chain.shutdown();
    await new Promise(resolve => setTimeout(resolve, 5000));

    chain.addHeartbeat = saveHeartbeatAdd;
    */

    const saveUpdate = chain.update;
    chain.update = async () => {
      throw Error("Error");
    };

    try {
      console.log('Before bootstrap');
      await chain.bootstrap(orchestratorMock);
      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch (error) {
      assert.equal(error.toString(), 'Error: Error', 'See if boostrap throws an error');
    }

    await chain.shutdown();
    await new Promise(resolve => setTimeout(resolve, 5000));
    chain.update = saveUpdate;

    // Reconnecting to chain
    await chain.connect();
  });

  it('Test chain update function', async () => {
    const saveGetLeader = chain.getLeader;
    const saveIsLeadedGroup = chain.isLeadedGroup;
    const saveCanSendTransactions = chain.canSendTransactions;
    const saveGetBestNumber = chain.getBestNumber;

    chain.getLeader = async () => '0x00001';
    chain.isLeadedGroup = async () => true;
    chain.canSendTransactions = async () => true;
    chain.getBestNumber = async () => 10000;
    chain.lastUpdateTime = 0;

    await chain.update();
    
    assert.equal(chain.currentLeaderValue, '0x00001', 'check if current leader was correctly set');
    assert.equal(chain.isLeadedGroupValue, true, 'check if is leaded group was correctly set');
    assert.equal(chain.canSendTransactionsValue, true, 'check if can send transaction was correctly set');
    assert.equal(chain.bestBlockNumber, 10000, 'check if best block number was set');
    assert.isAbove(chain.lastUpdateTime, 0, 'check if last update time was set');

    chain.getLeader = saveGetLeader;
    chain.isLeadedGroup = saveIsLeadedGroup;
    chain.canSendTransactions = saveCanSendTransactions;
    chain.getBestNumber = saveGetBestNumber;

    await chain.update();
  });

  it('Test chain moving forward function', async () => {
    const saveGetBestNumber = chain.getBestNumber;
    const saveLastBlockThreshold = chain.lastBlockThreshold;
    const saveBestBlockNumber = chain.bestBlockNumber;

    chain.getBestNumber = async () => 1;
    chain.bestBlockNumber = 1;
    chain.lastBlockThreshold = 3;

    let result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward 1');

    result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward 2');

    result = await chain.chainMovingForward();
    assert.equal(result, false, 'Check if chain is moving forward 3');
    assert.equal(chain.lastBlockAccumulator, 3, 'Check if last block accumulator threshold was reached');

    chain.getBestNumber = async () => 2;

    result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward after get number change 1');
    assert.equal(chain.bestBlockNumber, 2, 'Check if last block number was changed after get number change');
    assert.equal(chain.lastBlockAccumulator, 0, 'Check if last block accumulator was reset');

    result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward after get number change 2');

    result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward after get number change 3');

    result = await chain.chainMovingForward();
    assert.equal(result, false, 'Check if chain is moving forward after get number change 4');
    assert.equal(chain.lastBlockAccumulator, 3, 'Check if last block accumulator threshold was reached 2');

    chain.getBestNumber = async () => 250000000;

    result = await chain.chainMovingForward();
    assert.equal(result, true, 'Check if chain is moving forward after second get number change');
    assert.equal(chain.bestBlockNumber, 250000000, 'Check if last block number was changed after second get number change');
    assert.equal(chain.lastBlockAccumulator, 0, 'Check if last block accumulator was reset 2');

    chain.getBestNumber = saveGetBestNumber;
    chain.lastBlockThreshold = saveLastBlockThreshold;
    chain.bestBlockNumber = saveBestBlockNumber;
  });

  it('Test can send transaction function', async () => {
    const saveGetPeerNumber = chain.getPeerNumber;
    const saveGetSyncState = chain.getSyncState;
    const saveChainMovingForward = chain.chainMovingForward;

    chain.getPeerNumber = async () => 0;

    chain.getSyncState = async () => true;

    chain.chainMovingForward = async () => true;

    let result = await chain.canSendTransactions();
    assert.equal(result, false, 'Check if chain can send transactions while synching');

    chain.getPeerNumber = async () => 1;

    result = await chain.canSendTransactions();
    assert.equal(result, false, 'Check if chain can send transactions if peers number is 1 and chain is synching');

    chain.getSyncState = async () => false;

    result = await chain.canSendTransactions();
    assert.equal(result, true, 'Check if chain can send transactions if peers number is != 0 and chain is not synching');

    chain.chainMovingForward = async () => false;

    result = await chain.canSendTransactions();
    assert.equal(result, false, 'Check if chain can send transactions while chain is not moving forward');

    chain.chainMovingForward = async () => true;

    // Test if gap between best number and best number finalized
    const saveGetBestBlock = chain.getBestNumber;
    const saveGetBestFinalizedBlock = chain.getBestNumberFinalized;

    result = await chain.canSendTransactions();
    assert.equal(result, true, 'Check if chain can send transactions');

    chain.getBestNumber = async () => 10000;
    chain.getBestNumberFinalized = async () => 9000;

    result = await chain.canSendTransactions();
    assert.equal(result, false, 'Check if chain can not send transactions cause big gap between finalized and best blocks');

    chain.getBestNumber = async () => 10000;
    chain.getBestNumberFinalized = async () => 9999;

    result = await chain.canSendTransactions();
    assert.equal(result, true, 'Check if chain can send transactions if gap is small');

    chain.getBestNumber = saveGetBestBlock;
    chain.getBestNumberFinalized = saveGetBestFinalizedBlock;

    // Disconnecting from chain and waiting for full disconnect
    await chain.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    result = await chain.canSendTransactions();
    assert.equal(result, false, 'Check if chain can send transactions if not connected to chain');

    // Reconnecting to chain and restoring functions
    await chain.connect();
    await new Promise((resolve) => setTimeout(resolve, 5000));

    chain.getPeerNumber = saveGetPeerNumber;
    chain.getSyncState = saveGetSyncState;
    chain.chainMovingForward = saveChainMovingForward;
  });

  it('Test heartbeat addition', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;

    chain.nodeGroup = 2;
    chain.mnemonic = mnemonic2;

    const keys2 = await getKeysFromSeed(mnemonic2);
    const noHeartbeatYet = await chain.getHeartbeat(keys2.address.toString());
    assert.equal(noHeartbeatYet, 0, 'check if hearbeat is empty before submission');

    const result = await chain.addHeartbeat('active');
    assert.equal(result, true, 'check if heartbeat add transaction was executed');

    const heartbeat = await chain.getHeartbeat(keys2.address.toString());
    assert.isAbove(heartbeat, 0, 'check if heartbeat was added');

    const nodeStatus = await chain.getNodeStatus(keys2.address.toString());
    assert.equal(nodeStatus, 1, 'cheack node status');

    const nodeGroup = await chain.getNodeGroup(keys2.address.toString());
    assert.equal(nodeGroup, 2, 'check node group');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
  });

  it('Test leader set', async () => {
    const saveGroupId = chain.nodeGroup;
    chain.nodeGroup = 43;

    const bestBlockNumber = chain.bestBlockNumber;

    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const newLeader = await chain.getLeader();
    assert.equal(newLeader, keys.address, 'check if leader was set correctly');

    assert.isAbove(chain.bestBlockNumber, bestBlockNumber, 'Check if chain info was updated.');

    const statusGiveUp= await chain.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    chain.nodeGroup = saveGroupId;
  });

  it('Test LeadedGroup - no leader set', async () => {
    const saveGroupId = chain.nodeGroup;
    chain.nodeGroup = 42;
    const groupIsNotLeaded = await chain.isLeadedGroup();
    assert.equal(groupIsNotLeaded, false, 'check is a group is not leaded at the begining');

    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const groupIsLeaded = await chain.isLeadedGroup();
    assert.equal(groupIsLeaded, true, 'check if after leader set the group becomes leaded');

    const statusGiveUp = await chain.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    chain.nodeGroup = saveGroupId;
  });

  it('Test leadership giveup', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;

    const keys1 = await getKeysFromSeed(mnemonic1);

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    const status = await chain.setLeader(keys1.address);
    assert.equal(status, true, 'check if leader set transaction was executed');

    const leader = await chain.getLeader();
    assert.equal(leader.toString(), keys1.address, 'check if leader is key 1');
  
    const isLeadedGroupTrue = await chain.isLeadedGroup();
    assert.equal(isLeadedGroupTrue, true, 'check is group is leaded');

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic2;
  
    const statusBadWallet = await chain.giveUpLeadership();
    assert.equal(statusBadWallet, false, 'check if can give up leadership using bad key');

    chain.nodeGroup = 88;
    chain.mnemonic = mnemonic1;
  
    const statusBadGroup = await chain.giveUpLeadership();
    assert.equal(statusBadGroup, false, 'check if can give up leadership on bad group');
  
    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    const bestBlockNumber = chain.bestBlockNumber;

    const statusCorrect = await chain.giveUpLeadership();
    assert.equal(statusCorrect, true, 'check if can give up leadership using good key and correct group');

    assert.isAbove(chain.bestBlockNumber, bestBlockNumber, 'check if chain info was updated.');
  
    const isLeadedGroupFalse = await chain.isLeadedGroup();
    assert.equal(isLeadedGroupFalse, false, 'check if after give up the group becomed not leaded');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
  });

  it('Test leader set - leader is already set', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;

    const keys = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    const status1 = await chain.setLeader(keys.address);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader();
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');
  
    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic2;

    const status3 = await chain.setLeader(keys2.address);
    assert.equal(status3, false, 'check if leader was not set cause false old leader report');

    const status2 = await chain.setLeader(keys.address);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const newLeader = await chain.getLeader();
    const keysNew = await getKeysFromSeed(mnemonic2);
    assert.equal(newLeader.toString(), keysNew.address, 'check if new leader was correctly set');

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic2;

    const statusGiveUp = await chain.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
  });

  it('Test event listener that updates heartbeats', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;
    const saveChainHeartbeats = chain.heartbeats;

    chain.heartbeats = new Heartbeats(nodesWallets, archipelName);

    const orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: () => {}
    }

    chain.listenEvents(orchestratorMock);

    chain.nodeGroup = 42;
    chain.mnemonic = mnemonic1;

    const result1 = await chain.addHeartbeat('active');
    assert.equal(result1, true, 'check if add heartbeat transaction was executed');

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic2;

    const result2 = await chain.addHeartbeat('passive');
    assert.equal(result2, true, 'check if second add heartbeat transaction was executed');

    await new Promise((resolve) => setTimeout(resolve, 5000));
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    assert.equal(chain.heartbeats.getHeartbeat(keys1.address).group, '42', 'check if event was recieved and heartbeat was added 1');
    assert.isAbove(parseInt(chain.heartbeats.getHeartbeat(keys1.address).blockNumber), 0, 'check if heartbeat was added and blockNumber was set correctly 1');
    assert.equal(parseInt(chain.heartbeats.getHeartbeat(keys1.address).nodeStatus), 1, 'check if heartbeat was added and nodeStatus was set correctly 1');

    assert.equal(chain.heartbeats.getHeartbeat(keys2.address).group, '43', 'check if event was recieved and heartbeat was added 2');
    assert.isAbove(parseInt(chain.heartbeats.getHeartbeat(keys2.address).blockNumber), 0, 'check if heartbeat was added and blockNumber was set correctly 2');
    assert.equal(parseInt(chain.heartbeats.getHeartbeat(keys2.address).nodeStatus), 2, 'check if heartbeat was added and nodeStatus was set correctly 2');
    
    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
    chain.heartbeats = saveChainHeartbeats;
  });

  it('Test event listener at leader if other node took leadership', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;
    const saveChainHeartbeats = chain.heartbeats;

    const keys = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    const status1 = await chain.setLeader(keys.address);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader();
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');

    chain.heartbeats = new Heartbeats(nodesWallets, archipelName);

    let serviceMode = 'active';

    const orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: (mode) => {
        serviceMode = mode;
      }
    }

    const bestBlockNumber = chain.bestBlockNumber;

    chain.listenEvents(orchestratorMock);

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic2;

    // Creating another chain to simulate set leader from another node
    const chain2 = new Chain(chain.wsProvider, chain.heartbeats, 43, mnemonic2, 10000, 10000);
    await chain2.connect();

    const status2 = await chain2.setLeader(keys.address);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const leader2 = await chain2.getLeader();
    assert.equal(leader2.toString(), keys2.address, 'check if leader was correctly changed');

    const statusGiveUp = await chain2.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed 1');

    // Waiting 5 seconds to be sure that all if finished
    await new Promise(resolve => setTimeout(resolve, 5000));
    await chain2.disconnect();

    assert.equal(serviceMode, 'passive', 'Check if leader change event was recieved and service mode was changed to passive');
    assert.isAbove(chain.bestBlockNumber, bestBlockNumber, 'Check if chain info was updated');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
    chain.heartbeats = saveChainHeartbeats;
  });

  it('Test event listener at leader if other node in other group took leadership', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;
    const saveChainHeartbeats = chain.heartbeats;

    const keys = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    const status1 = await chain.setLeader(keys.address);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader();
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');
  
    chain.heartbeats = new Heartbeats(nodesWallets, archipelName);

    let serviceMode = 'active';

    const orchestratorMock = {
      heartbeatSendEnabled: true,
      heartbeatSendEnabledAdmin: true,
      getServiceMode: () => 1,
      serviceStart: (mode) => {
        serviceMode = mode;
      }
    }

    chain.listenEvents(orchestratorMock);

    // Creating another chain to simulate set leader from node in another group
    const chain2 = new Chain(chain.wsProvider, chain.heartbeats, 44, mnemonic2, 10000, 10000);
    await chain2.connect();

    const status2 = await chain2.setLeader(keys2.address);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const leader2 = await chain2.getLeader();
    assert.equal(leader2.toString(), keys2.address, 'check if leader was correctly changed');

    assert.equal(serviceMode, 'active', 'Check if leader change event was ignored and mode was not changed cause different groups');

    let statusGiveUp = await chain2.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    // Waiting 5 seconds to be sure that all if finished
    await new Promise(resolve => setTimeout(resolve, 5000));
    await chain2.disconnect();

    chain.nodeGroup = 43;
    chain.mnemonic = mnemonic1;

    statusGiveUp = await chain.giveUpLeadership();
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
    chain.heartbeats = saveChainHeartbeats;
  });

  it('Try send transaction if cant do it', async () => {
    const saveCanSendTransactions = chain.canSendTransactions;

    chain.canSendTransactions = async () => false;

    const result1 = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result1, false, 'Try to add hearbeat if chain cant recieve transactions');

    chain.canSendTransactions = saveCanSendTransactions;

    const result2 = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result2, true, 'Try to add hearbeat if chain can recieve transactions');
  });

  it('Check when chain can send transactions', async () => {
    const saveGroupId = chain.nodeGroup;
    const saveMnemonic = chain.mnemonic;

    const saveGetPeerNumber = chain.getPeerNumber;
    const saveGetSyncState = chain.getSyncState;

    chain.getPeerNumber = async () => 0;

    chain.getSyncState = async () => true;

    chain.nodeGroup = 1;
    chain.mnemonic = mnemonic1;

    let result = await chain.addHeartbeat('active');
    assert.equal(result, false, 'Try to add hearbeat if peers number is 0 and chain is synching');

    chain.getPeerNumber = async () => 1;

    result = await chain.addHeartbeat('active');
    assert.equal(result, false, 'Try to add hearbeat if peers number is 1 and chain is synching');

    chain.getSyncState = async () => false;

    result = await chain.addHeartbeat('active');
    assert.equal(result, true, 'Try to add hearbeat if peers number is != 0 and chain is not synching');

    chain.getPeerNumber = saveGetPeerNumber;
    chain.getSyncState = saveGetSyncState;

    result = await chain.addHeartbeat('active');
    assert.equal(result, true, 'Try to add hearbeat if chain can recieve transactions');

    chain.nodeGroup = saveGroupId;
    chain.mnemonic = saveMnemonic;
  });

  it('Test chain transaction fails if not connected to chain', async () => {
    // Disconnecting from chain and trying to execute each transaction
    let disconnect = await chain.disconnect();
    assert.equal(disconnect, true, 'Check if disconnect returns true');
    // Waiting 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    const keys = await getKeysFromSeed(mnemonic1);

    assert.equal(await chain.getHeartbeat(keys.address), 0, 'Trying to get heartbeat while not connected to chain');
    assert.equal(await chain.getNodeStatus(keys.address), 0, 'Trying to get node status while not connected to chain');
    assert.equal(await chain.getNodeGroup(keys.address), 0, 'Trying to get node group while not connected to chain');
    assert.equal(await chain.getBestNumber(), 0, 'Trying to getbest number while not connected to chain');
    assert.equal(await chain.getBestNumberFinalized(), 0, 'Trying to getbestfinalized number while not connected to chain');
    assert.equal(await chain.getPeerNumber(), 0, 'Trying to get peer number while not connected to chain')
    assert.equal(await chain.getSyncState(), 0, 'Trying to get sync state while not connected to chain');
    assert.equal(await chain.getPeerId(), false, 'Trying to get peer id while not connected to chain');

    // canSendTransaction must answer false
    assert.equal(await chain.addHeartbeat('active'), false, 'Try to add heartbeat while is not connected to chain 1');
    assert.equal(await chain.setLeader(keys.address), false, 'Try to set leader while is not connected to chain 1');
    assert.equal(await chain.giveUpLeadership(), false, 'Try to give up leadership while is not connected to chain 1');

    // Forcing canSendTransaction to true to provoke an exception
    const saveChainCanSendTransactions = chain.canSendTransactions;
    chain.canSendTransactions = async () => true;

    try {
      await chain.addHeartbeat('active');
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to add heartbeat while is not connected to chain 2');
    }

    try {
      await chain.setLeader(keys.address);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to set leader while is not connected to chain 2');
    }
    
    try {
      await chain.giveUpLeadership();
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to give up leadership while is not connected to chain 2');
    }

    // Try to provoke send transaction error by emulating nonce retrieval success
    chain.api.query.system.account = async () => { 
      const result = {}
      result.nonce = 1;
      return result; 
    };

    try {
      await chain.addHeartbeat('active');
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to add heartbeat while is not connected to chain 3');
    }

    try {
      await chain.setLeader(keys.address);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to set leader while is not connected to chain 3');
    }
    
    try {
      await chain.giveUpLeadership();
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to give up leadership while is not connected to chain 3');
    }

    // See if getter functions throws errors
    try {
      await chain.getLeader();
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to get leader while is not connected to chain');
    }

    try {
      await chain.isLeadedGroup();
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to check if group is leaded while is not connected to chain');
    }

    // Reconnecting to chain
    await chain.connect();
    chain.canSendTransactions = saveChainCanSendTransactions;
  });

  it('Test transaction drop simulation', async () => {
    // Simulating transactions fails
    let transactionFailSimulation = () => {
      return { 
        sign: () => {
          return { 
            send: (callback) => {
              const status = {
                isFinalized: false,
                isDropped: true,
                isInvalid: false,
                isUsurped: false
              }
              callback({events: [], status});
            }
          }
        } 
      }
    };

    // Simulate add heartbeat transaction drop
    const saveAddHeartbeat = chain.api.tx.archipelModule.addHeartbeat;

    chain.api.tx.archipelModule.addHeartbeat = transactionFailSimulation;

    let result = await chain.addHeartbeat('active');
    assert.equal(result, false, 'Check if add hearbeat returns false cause transaction is dropped');

    chain.api.tx.archipelModule.addHeartbeat = saveAddHeartbeat;

    // Simulate set leader transaction drop
    const saveSetLeader = chain.api.tx.archipelModule.setLeader;

    chain.api.tx.archipelModule.setLeader = transactionFailSimulation;

    result = await chain.setLeader(1);
    assert.equal(result, false, 'Check if set leader returns false cause transaction is dropped');

    chain.api.tx.archipelModule.setLeader = saveSetLeader;

    // Simulate giveup leadership transaction drop
    const saveGiveUpLeadership = chain.api.tx.archipelModule.giveUpLeadership;

    chain.api.tx.archipelModule.giveUpLeadership = transactionFailSimulation;

    result = await chain.giveUpLeadership();
    assert.equal(result, false, 'Check if giveup leadership returns false cause transaction is dropped');

    chain.api.tx.archipelModule.giveUpLeadership = saveGiveUpLeadership;
  });

  it('Test no events after transaction finalize', async () => {
    // Simulating transactions fails
    let transactionFinalizedWithoutEventsSimulation = () => {
      return { 
        sign: () => {
          return { 
            send: (callback) => {
              const status = {
                isFinalized: true,
                isDropped: false,
                isInvalid: false,
                isUsurped: false
              }
              callback({status});
            }
          }
        } 
      }
    };
    
    // Simulate add heartbeat transaction drop
    const saveAddHeartbeat = chain.api.tx.archipelModule.addHeartbeat;

    chain.api.tx.archipelModule.addHeartbeat = transactionFinalizedWithoutEventsSimulation;

    let result = await chain.addHeartbeat('active');
    assert.equal(result, false, 'Check if add hearbeat returns false cause no events received');

    chain.api.tx.archipelModule.addHeartbeat = saveAddHeartbeat;

    // Simulate set leader transaction drop
    const saveSetLeader = chain.api.tx.archipelModule.setLeader;

    chain.api.tx.archipelModule.setLeader = transactionFinalizedWithoutEventsSimulation;

    result = await chain.setLeader(1);
    assert.equal(result, false, 'Check if set leader returns false cause no events received');

    chain.api.tx.archipelModule.setLeader = saveSetLeader;

    // Simulate giveup leadership transaction drop
    const saveGiveUpLeadership = chain.api.tx.archipelModule.giveUpLeadership;

    chain.api.tx.archipelModule.giveUpLeadership = transactionFinalizedWithoutEventsSimulation;

    result = await chain.giveUpLeadership();
    assert.equal(result, false, 'Check if giveup leadership returns false cause no events received');

    chain.api.tx.archipelModule.giveUpLeadership = saveGiveUpLeadership;
  });
});
