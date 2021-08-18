/* eslint-disable */
const { assert } = require('chai');
const { Heartbeats } = require('../src/heartbeats');

// Test configuration
const testTimeout = 60000;
const nodesWallets = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'
const archipelName = 'test-archipel';
const config = { nodesWallets: nodesWallets, archipelName: archipelName };

describe('Heartbeats test', function () {
  this.timeout(testTimeout);

  it('Test heartbeats addition', async function () {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 1500);

    assert.equal(JSON.stringify(heartbeats.getHeartbeat(nodesWallets.split(',')[0])), JSON.stringify({ name: 'test-archipel-NODE-1', group: 42, nodeStatus:1, blockNumber: 1500 }), 'check if heartbeat was added correctly');
  });

  it('Test anyone is alive with empty heartbeats', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 1, 20), false, 'check if anyone is alive without adding any heartbeats');
  });


  it('Test anyone is alive with one heartbeat from testing wallet', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 20), false, 'check if anyone is alive with adding only heartbeat from my wallet');
  });

  it('Test anyone is alive with one heartbeat from other wallet and no heartbeat from testing wallet', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 42, 1, 10);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 20), false, 'check if anyone is alive with adding only heartbeat from other wallet');
  });

  it('Test anyone is alive with two hearbeats from two different wallets', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 42, 2, 10);
  
    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 15), true, 'check if anyone is alive with adding two heartbeats from two different wallets');
    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 20), false, 'check if anyone is alive if other wallet heartbeat is old');
  });

  it('Test anyone is alive with heartbeat from other wallet in other group', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 43, 2, 10);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 15), true, 'check if anyone is alive with heartbeat from other wallet in other group');
  });

  it('Test anyone is alive with heartbeat from other wallet in other group with zero block number', async () => {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 0);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 43, 2, 0);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 100, 42, 20), false, 'check if anyone is alive returns false cause zero block number');
  });

  it('check get all heartbeats function', async function () {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 43, 2, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[2], 43, 2, 10);

    const allHeartbeats = heartbeats.getAllHeartbeats();

    assert.equal(allHeartbeats.length, 3, 'check if the hearbeats size is correct');
    assert.equal(allHeartbeats[0].wallet, nodesWallets.split(',')[0], 'check if heartbeat from wallet 1 was added');
    assert.equal(allHeartbeats[1].wallet, nodesWallets.split(',')[1], 'check if heartbeat from wallet 1 was added');
    assert.equal(allHeartbeats[2].wallet, nodesWallets.split(',')[2], 'check if heartbeat from wallet 1 was added');
  
  });

  it('check wallet that is not in the nodes wallets', async function () {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
    heartbeats.addHeartbeat('toto', 42, 1, 10);
    const allHeartbeats = heartbeats.getAllHeartbeats();
    assert.equal(allHeartbeats.length, 1, 'check if hearbeat was added');
    assert.equal(allHeartbeats[0].name, '', 'check if hearbeat name is empty');
  });
});