/* eslint-disable */
const { exec } = require('child_process');
const { assert } = require('chai');
const { Chain } = require('../src/chain');
const { getKeysFromSeed, constructNodesList } = require('../src/utils');
const { Heartbeats } = require('../src/heartbeats');

// Test configuration
let chain;
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

describe('Archipel chain test', function(){
  this.timeout(testTimeout);

  before(async function() {
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
    chain = new Chain(config.nodeWs);
    await chain.connect();

    // Construct nodes list
    const nodes = constructNodesList(nodesWallets, 'node1');
  });

  after(async function() {
    if (chain) {
      await chain.disconnect();
    }
    // Removing test chain
    console.log('Removing test chain...');
    const commandToExec = 'cd ../deployer/test/chain && ./remove.sh';
    await execAsync(commandToExec);
  });

  it('Test if chain is working correctly', async function () {
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

  it('Test heartbeat addition', async function() {
    const keys = await getKeysFromSeed(mnemonic1);
    const noHeartbeatYet = await chain.getHeartbeat(keys.address.toString());
    assert.equal(parseInt(noHeartbeatYet.toString()), 0, 'check if hearbeat is empty before submission');

    const result = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result, true, 'check if heartbeat add transaction was executed');

    const heartbeat = await chain.getHeartbeat(keys.address.toString());
    assert.isAbove(parseInt(heartbeat.toString()), 0, 'check if heartbeat was added');

    const nodeStatus = await chain.getNodeStatus(keys.address.toString());
    assert.equal(nodeStatus, 1, 'cheack node status');

    const nodeGroup = await chain.getNodeGroup(keys.address.toString());
    assert.equal(nodeGroup, 1, 'check node group');
  });

  it('Test leader set', async function() {
    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 43, mnemonic1);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const newLeader = await chain.getLeader(43);
    assert.equal(newLeader, keys.address, 'check if leader was set correctly');

    const statusGiveUp= await chain.giveUpLeadership(43, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
  });

  it('Test LeadedGroup - no leader set', async function() {
    const groupIsNotLeaded = await chain.isLeadedGroup(42);
    assert.equal(groupIsNotLeaded, false, 'check is a group is not leaded at the begining');

    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 42, mnemonic1);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const groupIsLeaded = await chain.isLeadedGroup(42);
    assert.equal(groupIsLeaded, true, 'check if after leader set the group becomes leaded');

    const statusGiveUp = await chain.giveUpLeadership(42, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
  });


  it('Test leadership giveup', async function() {
    const keys1 = await getKeysFromSeed(mnemonic1);

    const status = await chain.setLeader(keys1.address, 43, mnemonic1);
    assert.equal(status, true, 'check if leader set transaction was executed');

    const leader = await chain.getLeader(43);
    assert.equal(leader.toString(), keys1.address, 'check if leader is key 1');
  
    const isLeadedGroupTrue = await chain.isLeadedGroup(43);
    assert.equal(isLeadedGroupTrue, true, 'check is group is leaded');
  
    const statusBadWallet = await chain.giveUpLeadership(43, mnemonic2);
    assert.equal(statusBadWallet, false, 'check if can give up leadership using bad key');
  
    const statusBadGroup = await chain.giveUpLeadership(88, mnemonic1);
    assert.equal(statusBadGroup, false, 'check if can give up leadership on bad group');
  
    const statusCorrect = await chain.giveUpLeadership(43, mnemonic1);
    assert.equal(statusCorrect, true, 'check if can give up leadership using good key and correct group');
  
    const isLeadedGroupFalse = await chain.isLeadedGroup(43);
    assert.equal(isLeadedGroupFalse, false, 'check if after give up the group becomed not leaded');
  });

  it('Test leader set - leader is already set', async function () {
    const keys = await getKeysFromSeed(mnemonic1);

    const status1 = await chain.setLeader(keys.address, 43, mnemonic1);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader(43);
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');
  
    const status2 = await chain.setLeader(keys.address, 43, mnemonic2);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const newLeader = await chain.getLeader(43);
    const keysNew = await getKeysFromSeed(mnemonic2);
    assert.equal(newLeader.toString(), keysNew.address, 'check if new leader was correctly set');

    const statusGiveUp = await chain.giveUpLeadership(43, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
  });

  it('Test event listener that updates heartbeats', async function () {

    const heartbeats = new Heartbeats(nodesWallets, archipelName);

    const orchestrator = { mnemonic: mnemonic1, serviceStart: function () {}, group: 42 };

    chain.listenEvents(heartbeats, orchestrator, mnemonic1);

    const result1 = await chain.addHeartbeat('active', mnemonic1, '42');
    assert.equal(result1, true, 'check if add heartbeat transaction was executed');

    const result2 = await chain.addHeartbeat('passive', mnemonic2, '43');
    assert.equal(result2, true, 'check if second add heartbeat transaction was executed');

    await new Promise((resolve) => setTimeout(resolve, 5000));
  
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    assert.equal(heartbeats.getHeartbeat(keys1.address).group, '42', 'check if event was recieved and heartbeat was added 1');
    assert.isAbove(parseInt(heartbeats.getHeartbeat(keys1.address).blockNumber), 0, 'check if heartbeat was added and blockNumber was set correctly 1');
    assert.equal(parseInt(heartbeats.getHeartbeat(keys1.address).nodeStatus), 1, 'check if heartbeat was added and nodeStatus was set correctly 1');

    assert.equal(heartbeats.getHeartbeat(keys2.address).group, '43', 'check if event was recieved and heartbeat was added 2');
    assert.isAbove(parseInt(heartbeats.getHeartbeat(keys2.address).blockNumber), 0, 'check if heartbeat was added and blockNumber was set correctly 2');
    assert.equal(parseInt(heartbeats.getHeartbeat(keys2.address).nodeStatus), 2, 'check if heartbeat was added and nodeStatus was set correctly 2');
  });

  it('Test event listener at leader if other node took leadership', async function (){
    const keys = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    const status1 = await chain.setLeader(keys.address, 43, mnemonic1);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader(43);
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');
  
    const heartbeats = new Heartbeats(nodesWallets, archipelName);

    let serviceMode = 'active';

    const service = {
      serviceStart: (mode) => {
        serviceMode = mode;
      }
    }
    const orchestrator = { mnemonic: mnemonic1, service: service, group: 43 };

    chain.listenEvents(heartbeats, orchestrator, mnemonic1);

    const status2 = await chain.setLeader(keys.address, 43, mnemonic2);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const leader2 = await chain.getLeader(43);
    assert.equal(leader2.toString(), keys2.address, 'check if leader was correctly changed');

    assert.equal(serviceMode, 'passive', 'Check if leader change event was recieved and service mode was changed to passive');

    const statusGiveUp = await chain.giveUpLeadership(43, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
  });


  it('Test event listener at leader if other node in other group took leadership', async function (){
    const keys = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);

    const status1 = await chain.setLeader(keys.address, 43, mnemonic1);
    assert.equal(status1, true, 'check if leader set transaction was executed');
  
    const leader = await chain.getLeader(43);
    assert.equal(leader.toString(), keys.address, 'check if leader was correctly set');
  
    const heartbeats = new Heartbeats(nodesWallets, archipelName);

    let serviceMode = 'active';

    const service = {
      serviceStart: (mode) => {
        serviceMode = mode;
      }
    }
    const orchestrator = { mnemonic: mnemonic1, service: service, group: 43 };

    chain.listenEvents(heartbeats, orchestrator, mnemonic1);

    const status2 = await chain.setLeader(keys2.address, 44, mnemonic2);
    assert.equal(status2, true, 'check if leader was correctly changed');

    const leader2 = await chain.getLeader(44);
    assert.equal(leader2.toString(), keys2.address, 'check if leader was correctly changed');

    assert.equal(serviceMode, 'active', 'Check if leader change event was ignored and mode was not changed cause different groups');

    let statusGiveUp = await chain.giveUpLeadership(44, mnemonic2);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');

    statusGiveUp = await chain.giveUpLeadership(43, mnemonic1);
    assert.equal(statusGiveUp, true, 'check if give up leadership transaction was executed');
  });

  it('Try send transaction if cant do it', async function () {
    const saveCanSendTransactions = chain.canSendTransactions;

    chain.canSendTransactions = async () => false;

    const result1 = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result1, false, 'Try to add hearbeat if chain cant recieve transactions');

    chain.canSendTransactions = saveCanSendTransactions;

    const result2 = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result2, true, 'Try to add hearbeat if chain can recieve transactions');
  });

  it('Check when chain can send transactions', async function () {
    const saveGetPeerNumber = chain.getPeerNumber;
    const saveGetSyncState = chain.getSyncState;

    chain.getPeerNumber = async () => 0;

    chain.getSyncState = async () => true;

    let result = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result, false, 'Try to add hearbeat if peers number is 0 and chain is synching');

    chain.getPeerNumber = async () => 1;

    result = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result, false, 'Try to add hearbeat if peers number is 1 and chain is synching');

    chain.getSyncState = async () => false;

    result = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result, true, 'Try to add hearbeat if peers number is != 0 and chain is not synching');

    chain.getPeerNumber = saveGetPeerNumber;
    chain.getSyncState = saveGetSyncState;

    result = await chain.addHeartbeat('active', mnemonic1, '1');
    assert.equal(result, true, 'Try to add hearbeat if chain can recieve transactions');
  });

  it('Test chain transaction fail tests', async function () {
    // Disconnecting from chain and trying to execute each transaction
    await chain.disconnect();

    const keys = await getKeysFromSeed(mnemonic1);

    assert.equal(await chain.getHeartbeat(keys.address), false, 'Trying to get heartbeat while not connected to chain');
    assert.equal(await chain.getNodeStatus(keys.address), false, 'Trying to get node status while not connected to chain');
    assert.equal(await chain.getNodeGroup(keys.address), false, 'Trying to get node group while not connected to chain');
    assert.equal(await chain.getBestNumber(), 0, 'Trying to getbest number while not connected to chain');
    assert.equal(await chain.getPeerNumber(), 0, 'Trying to get peer number while not connected to chain')
    assert.equal(await chain.getSyncState(), 0, 'Trying to get sync state while not connected to chain');
    assert.equal(await chain.getPeerId(), false, 'Trying to get peer id while not connected to chain');

    // canSendTransaction must answer false
    assert.equal(await chain.addHeartbeat('active', mnemonic1, '44'), false, 'Try to add heartbeat while is not connected to chain 1');
    assert.equal(await chain.setLeader(keys.address, 44, mnemonic1), false, 'Try to set leader while is not connected to chain 1');
    assert.equal(await chain.giveUpLeadership(44, mnemonic1), false, 'Try to give up leadership while is not connected to chain 1');

    // Forcing canSendTransaction to true to provoke an exception
    const saveChainCanSendTransactions = chain.canSendTransactions;
    chain.canSendTransactions = async () => true;

    try {
      await chain.addHeartbeat('active', mnemonic1, '44');
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to add heartbeat while is not connected to chain 2');
    }

    try {
      await chain.setLeader(keys.address, 44, mnemonic1);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to set leader while is not connected to chain 2');
    }
    
    try {
      await chain.giveUpLeadership(44, mnemonic1);
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
      await chain.addHeartbeat('active', mnemonic1, '44');
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to add heartbeat while is not connected to chain 3');
    }

    try {
      await chain.setLeader(keys.address, 44, mnemonic1);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to set leader while is not connected to chain 3');
    }
    
    try {
      await chain.giveUpLeadership(44, mnemonic1);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to give up leadership while is not connected to chain 3');
    }

    // See if getter functions throws errors
    try {
      await chain.getLeader(44);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to get leader while is not connected to chain');
    }

    try {
      await chain.isLeadedGroup(44);
    } catch (error) {
      assert.equal(error.toString(), 'Error: WebSocket is not connected', 'Try to check if group is leaded while is not connected to chain');
    }

    // Reconnecting to chain
    await chain.connect();
    chain.canSendTransactions = saveChainCanSendTransactions;

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

    let result = await chain.addHeartbeat('active', mnemonic1, 1);
    assert.equal(result, false, 'Check if add hearbeat returns false cause transaction is dropped');

    chain.api.tx.archipelModule.addHeartbeat = saveAddHeartbeat;

    // Simulate set leader transaction drop
    const saveSetLeader = chain.api.tx.archipelModule.setLeader;

    chain.api.tx.archipelModule.setLeader = transactionFailSimulation;

    result = await chain.setLeader(1, 1, mnemonic1);
    assert.equal(result, false, 'Check if set leader returns false cause transaction is dropped');

    chain.api.tx.archipelModule.setLeader = saveSetLeader;

    // Simulate giveup leadership transaction drop
    const saveGiveUpLeadership = chain.api.tx.archipelModule.giveUpLeadership;

    chain.api.tx.archipelModule.giveUpLeadership = transactionFailSimulation;

    result = await chain.giveUpLeadership(1, mnemonic1);
    assert.equal(result, false, 'Check if giveup leadership returns false cause transaction is dropped');

    chain.api.tx.archipelModule.giveUpLeadership = saveGiveUpLeadership;

  });

});