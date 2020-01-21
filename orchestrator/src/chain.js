const { ApiPromise, WsProvider } = require('@polkadot/api');
const { getKeysFromSeed } = require('./utils');
const debug = require('debug')('chain');

// Here we will store wallet nonce
let globalNonce = 0;

// Show transaction status in debug
const transactionShowStatus = (status, where) => {
  if (status.isInvalid) debug(where, 'Transaction is invalid.');
  if (status.isDropped) debug(where, 'Transaction is dropped.');
  if (status.isUsurped) debug(where, 'Transaction is usurped.');
  if (status.isReady) debug(where, 'Transaction is ready.');
  if (status.isFuture) debug(where, 'Transaction is future.');
  if (status.isFinalized) debug(where, 'Transaction is finilized.');
  if (status.isBroadcast) debug(where, 'Transaction is broadcast.');
};

// Conecting to provider
const connect = async (wsProvider, mnemonic) => {
  try {
    // Creating Websocket Provider
    const provider = new WsProvider(wsProvider);
    // Creating API
    const api = await ApiPromise.create({ provider });

    // Setting global nonce
    const keys = getKeysFromSeed(mnemonic);
    const nonce = await api.query.system.accountNonce(keys.address);
    globalNonce = nonce;
    debug('connect', `Global nonce: ${globalNonce}`);

    return api;
  } catch (error) {
    debug('connect', error);
    throw error;
  }
};

// Listen events
const listenEvents = async (api, metrics) => {
  try {
    // Subscribe to events
    await api.query.system.events((events) => {
      // Loop through events
      events.forEach(({ event = [] }) => {
        // Add metrics if Metrics updated event was recieved
        if (event.section.toString() === 'archipelModule' && event.method.toString() === 'MetricsUpdated') {
          debug('listenEvents', `Recieved metrics updated event from ${event.data[0]}`);
          metrics.addMetrics(event.data[0].toString(), event.data[1].toString(), event.data[2].toString());
        }
      });
    });
  } catch (error) {
    debug('listenEvents', error);
    throw error;
  }
};

// Send metrics
const addMetrics = async (api, metrics, mnemonic) => {
  try {
    // Get peers number
    const peersNumber = await getPeerNumber(api);
    debug('addMetrics', `This node has ${peersNumber} peers.`);

    if (peersNumber !== 0) {
      console.log('Archipel node has some peers so adding metrics...');
      // Get keys from mnemonic
      const keys = getKeysFromSeed(mnemonic);

      // Get account nonce
      // const nonce = await api.query.system.accountNonce(keys.address);
      const nonce = globalNonce;
      // Nonce show
      debug('addMetrics', `Nonce: ${nonce}`);

      // Incrementing global nonce
      globalNonce++;

      debug('addMetrics', `Global Nonce: ${globalNonce}`);

      // create, sign and send transaction
      await api.tx.archipelModule
        // create transaction
        .addMetrics(metrics)
        // Sign transcation
        .sign(keys, { nonce })
        // Send transaction
        .send(({ events = [], status }) => {
          // Debug show transaction status
          transactionShowStatus(status, 'addMetrics');
          if (status.isFinalized) {
            events.forEach(async ({ event: { data, method, section } }) => {
              if (section.toString() === 'archipelModule' && method.toString() === 'MetricsUpdated') {
                // Show transaction data for Debug
                debug('addMetrics', 'Transaction was successfully sent and generated an event.');
                debug('addMetrics', `JSON Data: [${JSON.parse(data.toString())}]`);
              }
            });
          }
        });
      debug('addMetrics', 'Transaction was sent.');
      return true;
    } else {
      console.log('Archipel node has no peers. Waiting for peers before adding metrics...');
      return false;
    }
  } catch (error) {
    debug('addMetrics', error);
    return false;
  }
};

// Get current leader from Runtime
const getLeader = async api => {
  try {
    return await api.query.archipelModule.master();
  } catch (error) {
    debug('getLeader', error);
    return false;
  }
};

// Get peer number connected to Archipel node
const getPeerNumber = async api => {
  try {
    const peers = await api.rpc.system.peers();
    return peers.length;
  } catch (error) {
    debug('getPeerNumber', error);
    return 0;
  }
};

// Set leader
const setLeader = async (api, oldLeader, mnemonic) => {
  try {
    // Get keys from mnemonic
    const keys = getKeysFromSeed(mnemonic);

    // Get account nonce
    // const nonce = await api.query.system.accountNonce(keys.address);
    const nonce = globalNonce;
    // Nonce show
    debug('setLeader', `Nonce: ${nonce}`);

    // Incrementing global nonce
    globalNonce++;

    debug('setLeader', `Global Nonce: ${globalNonce}`);

    return new Promise((resolve, reject) => {
      // create, sign and send transaction
      api.tx.archipelModule
        // create transaction
        .setMaster(oldLeader)
        // Sign and transcation
        .sign(keys, { nonce })
        // Send transaction
        .send(({ events = [], status }) => {
          // Debug show transaction status
          transactionShowStatus(status, 'setLeader');
          if (status.isFinalized) {
            events.forEach(async ({ event: { data, method, section } }) => {
              if (section.toString() === 'archipelModule' && method.toString() === 'NewMaster') {
                // Show transaction data for Debug
                console.log('Transaction was successfully sent and generated an event.');
                console.log(`JSON Data: [${JSON.parse(data.toString())}]`);
                resolve(true);
              }
            });
            resolve(false);
          }
        }).catch(err => reject(err));
    });
  } catch (error) {
    debug('setLeader', error);
    throw error;
  }
};

const chainNodeInfo = async api => {
  try {
    const networkState = await api.rpc.system.networkState();
    const health = await api.rpc.system.health();

    console.log('--------------- Chain node network state and health ----------------');
    console.log(`Peer ID: ${networkState.peerId}`);
    console.log(`Peer number: ${health.peers}`);
    console.log(`Is syncing?: ${health.isSyncing}`);
    console.log('--------------------------------------------------------------------');
  } catch (error) {
    debug('chainNodeInfo', error);
  }
};

module.exports = {
  connect,
  listenEvents,
  addMetrics,
  getLeader,
  setLeader,
  getPeerNumber,
  chainNodeInfo
};
