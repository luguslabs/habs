/* eslint-disable */
const { exec } = require('child_process');
const { assert } = require('chai');
const { Chain } = require('../src/chain');
const { getKeysFromSeed, constructNodesList } = require('../src/utils');
const { Heartbeats } = require('../src/heartbeats');

// Test configuration
let chain;
const testTimeout = 60000;
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

    // Launching test chain
    console.log('Launching test chain. Can take some time...');
    const commandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
    await execAsync(commandToExec);
    console.log('Test chain was launched...');

    const config = {
      nodeWs: 'ws://127.0.0.1:9944',
      heartbeatEnabled: true,
      mnemonic: mnemonic1,
      nodeGroupId: '1'
    };
    
    console.log('Connection to chain...');
    // Connecting to Archipel Chain Node
    chain = new Chain(config);
    await chain.connect();
    // Construct nodes list
    const nodes = constructNodesList(nodesWallets, 'node1');
  });

  it('Test heartbeat addition', async function() {
    const keys = await getKeysFromSeed(mnemonic1);
    const noHeartbeatYet = await chain.getHeartbeat(keys.address.toString());
    assert.equal(parseInt(noHeartbeatYet.toString()), 0, 'check if hearbeat is empty before submission');

    const result = await chain.addHeartbeat('active');
    assert.equal(result, true, 'check if heartbeat add transaction was executed');

    const heartbeat = await chain.getHeartbeat(keys.address.toString());
    assert.isAbove(parseInt(heartbeat.toString()), 0, 'check if heartbeat was added');

    const nodeStatus = await chain.getNodeStatus(keys.address.toString());
    assert.equal(nodeStatus, 1, 'cheack node status');

    const nodeGroup = await chain.getNodeGroup(keys.address.toString());
    assert.equal(nodeGroup, 1, 'check node group');
  });

  it('Test LeadedGroup - no leader set', async function() {
    const groupIsNotLeaded = await chain.isLeadedGroup(42);
    assert.equal(groupIsNotLeaded, false, 'check is a group is not leaded at the begining');

    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 42, mnemonic1);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const groupIsLeaded = await chain.isLeadedGroup(42);
    assert.equal(groupIsLeaded, true, 'check if after leader set the group becomes leaded');
  });

  it('Test leader set', async function() {
    const keys = await getKeysFromSeed(mnemonic1);
    const status = await chain.setLeader(keys.address, 43, mnemonic1);
    assert.equal(status, true, 'check if leader set transaction was executed');
  
    const newLeader = await chain.getLeader(43);
    assert.equal(newLeader, keys.address, 'check if leader was set correctly');
  });

  it('Test leadership giveup', async function() {
    const keys1 = await getKeysFromSeed(mnemonic1);

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
  });

  it('Test event listener that updates heartbeats', async function () {

    const config = {
      nodesWallets: nodesWallets,
      archipelName: archipelName
    };

    const heartbeats = new Heartbeats(config);

    const orchestrator = { serviceStart: function () {} };

    chain.listenEvents(heartbeats, orchestrator);

    chain.mnemonic = mnemonic1;
    chain.nodeGroupId = '42';
    const result1 = await chain.addHeartbeat('active');
    assert.equal(result1, true, 'check if add heartbeat transaction was executed');

    chain.mnemonic = mnemonic2;
    chain.nodeGroupId = '43';
    const result2 = await chain.addHeartbeat('passive');
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

    chain.mnemonic = mnemonic1;
    chain.nodeGroupId = '1';

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


});