/* eslint-disable */
const { assert } = require('chai');
const { Heartbeats } = require('../src/heartbeats');

// Set env variables
process.env.DEBUG = 'app,chain,docker,heartbeats,polkadot,service,api,orchestrator,restoredb,stonith,utils';

// Test configuration
const testTimeout = 60000;
const nodesWallets = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'
const archipelName = 'test-archipel';
const config = { nodesWallets: nodesWallets, archipelName: archipelName };

describe('Heartbeats test', function(){
  this.timeout(testTimeout);

  it('Test heartbeats addition', async function () {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 1500);

    assert.equal(JSON.stringify(heartbeats.getHeartbeat(nodesWallets.split(',')[0])), JSON.stringify({ name: 'test-archipel-NODE-1', group: 42, nodeStatus:1, blockNumber: 1500 }), 'check if heartbeat was added correctly');
  });

  it('Test anyone is alive with empty heartbeats', async function() {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 1, 20), false, 'check if anyone is alive without adding any heartbeats');
  });


  it('Test anyone is alive with one heartbeat from testing wallet', async function() {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 20), false, 'check if anyone is alive with adding only heartbeat from my wallet');
  });

  it('Test anyone is alive with two hearbeats from two different wallets', async function() {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 42, 2, 10);
  
    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 15), true, 'check if anyone is alive with adding two heartbeats from two different wallets');
    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 20), false, 'check if anyone is alive if other wallet heartbeat is old');
  });

  it('Test anyone is alive with heartbeat from other wallet in other group', async function() {
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    heartbeats.addHeartbeat(nodesWallets.split(',')[0], 42, 1, 10);
    heartbeats.addHeartbeat(nodesWallets.split(',')[1], 43, 2, 10);

    assert.equal(heartbeats.anyOneAlive(nodesWallets.split(',')[0], 10, 42, 15), true, 'check if anyone is alive with heartbeat from other wallet in other group');
  });

});