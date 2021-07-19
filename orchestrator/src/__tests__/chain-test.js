/* eslint-disable */

const { exec } = require('child_process');
const { assert } = require('chai');
const { Chain } = require('../chain');
const { getKeysFromSeed, constructNodesList} = require('../utils');
const { Heartbeats } = require('../heartbeats');
const { arrayFilter } = require('@polkadot/util');

// Test configuration
let chain;
const testTimeout = 60000;
const mnemonic1 = 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 = 'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 = 'borrow initial guard hunt corn trust student opera now economy thumb argue';
const NODES_WALLETS = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'

// Promisify exec
const execAsync = cmd => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      reject(Error(stdout + stderr));
    }
    resolve(stdout + stderr);
  });
});

describe('chain-test', function(){
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
      nodeGroupId: 1
    };
    
    console.log('Connection to chain...');
    // Connecting to Archipel Chain Node
    chain = new Chain(config);
    await chain.connect();
    // Construct nodes list
    const nodes = constructNodesList(NODES_WALLETS, 'node1');
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

/*


test('LeadedGroup test - no leader set', async () => {
  const isLeadedGroupFalse = await chain.isLeadedGroup(42);
  expect(isLeadedGroupFalse).toBe(false);

  const keys = await getKeysFromSeed(mnemonic1);
  const status = await chain.setLeader(keys.address, 42, mnemonic1);
  expect(status).toBe(true);

  const isLeadedGroupTrue = await chain.isLeadedGroup(42);
  expect(isLeadedGroupTrue).toBe(true);
});

test('Set and get leader test', async () => {
  const keys = await getKeysFromSeed(mnemonic1);
  const status = await chain.setLeader(keys.address, 43, mnemonic1);
  expect(status).toBe(true);

  const newLeader = await chain.getLeader(43);
  expect(newLeader.toString()).toBe(keys.address);
});

test('Test giveUp Leadership', async () => {
  const leader = await chain.getLeader(43);
  const keys1 = await getKeysFromSeed(mnemonic1);
  expect(leader.toString()).toBe(keys1.address);

  const isLeadedGroupTrue = await chain.isLeadedGroup(43);
  expect(isLeadedGroupTrue).toBe(true);

  const statuskoWallet = await chain.giveUpLeadership(43, mnemonic2);
  expect(statuskoWallet).toBe(false);

  const statusKoGroup = await chain.giveUpLeadership(88, mnemonic1);
  expect(statusKoGroup).toBe(false);

  const statusok = await chain.giveUpLeadership(43, mnemonic1);
  expect(statusok).toBe(true);

  const isLeadedGroupFalse = await chain.isLeadedGroup(43);
  expect(isLeadedGroupFalse).toBe(false);
});

test('Get and set leader - leader is already set', async () => {

  const keys = await getKeysFromSeed(mnemonic1);

  const status1 = await chain.setLeader(keys.address,43, mnemonic1);
  expect(status1).toBe(true);

  const leader = await chain.getLeader(43);
  expect(leader.toString()).toBe(keys.address);

  const status2 = await chain.setLeader(keys.address,43, mnemonic2);
  expect(status2).toBe(true);

  const newLeader = await chain.getLeader(43);
  const keysNew = await getKeysFromSeed(mnemonic2);
  expect(newLeader.toString()).toBe(keysNew.address);
});

test('Test event listener that updates heartbeats', async () => {
  const heartbeats = new Heartbeats();
  const orchestrator = { serviceStart: function () {} };

  chain.listenEvents(heartbeats, orchestrator, mnemonic1);

  const result1 = await chain.addHeartbeat('42','active', mnemonic1);
  expect(result1).toBe(true);
  const result2 = await chain.addHeartbeat('43','passive', mnemonic2);
  expect(result2).toBe(true);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const keys1 = await getKeysFromSeed(mnemonic1);
  const keys2 = await getKeysFromSeed(mnemonic2);
  const keys3 = await getKeysFromSeed(mnemonic3);

  expect(heartbeats.getHeartbeat(keys1.address).group).toBe('42');
  expect(parseInt(heartbeats.getHeartbeat(keys1.address).blockNumber)).toBeGreaterThan(0)
  expect(parseInt(heartbeats.getHeartbeat(keys1.address).nodeStatus)).toBe(1);
  expect(heartbeats.getHeartbeat(keys2.address).group).toBe('43');
  expect(parseInt(heartbeats.getHeartbeat(keys2.address).blockNumber)).toBeGreaterThan(0)
  expect(parseInt(heartbeats.getHeartbeat(keys2.address).nodeStatus)).toBe(2);
  expect(heartbeats.getHeartbeat(keys3.address).group).toBe('44');
  expect(parseInt(heartbeats.getHeartbeat(keys3.address).blockNumber)).toBeGreaterThan(0)
  expect(parseInt(heartbeats.getHeartbeat(keys3.address).nodeStatus)).toBe(3);
});

*/