const { ApiPromise, WsProvider } = require('@polkadot/api');
const { getKeysFromSeed } = require('./utils');
const debug = require('debug')('chain');

// Show transaction status in debug
const transactionShowStatus = (status, where) => {
  if (status.isInvalid) debug(where, 'Transaction is invalid.');
  if (status.isDropped) debug(where, 'Transaction is dropped.');
  if (status.isUsurped) debug(where, 'Transaction is usurped.');
  if (status.isReady) debug(where, 'Transaction is ready.');
  if (status.isFuture) debug(where, 'Transaction is future.');
};

// Conecting to provider
const connect = async wsProvider => {
  try {
    // Creating Websocket Provider
    const provider = new WsProvider(wsProvider);
    // Create and return Polkadot API
    return ApiPromise.create({ provider });
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
          console.log(`Recieved metrics updated event from ${event.data[0]}`);
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
const addMetrics = async (metrics, api, mnemonic) => {
  try {
    // Get keys from mnemonic
    const keys = getKeysFromSeed(mnemonic);
    // Get account nonce
    const nonce = await api.query.system.accountNonce(keys.address);

    // Nonce show
    debug('addMetrics', `Nonce: ${nonce.toString()}`);

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
              console.log('Transaction was successfully sent and generated an event.');
              console.log(`JSON Data: [${JSON.parse(data.toString())}]`);
            }
          });
        }
      });
    console.log('Transaction was sent');
    return true;
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

// Set leader
const setLeader = async (oldLeader, api, mnemonic) => {
  try {
    // Get keys from mnemonic
    const keys = getKeysFromSeed(mnemonic);

    // Get account nonce
    const nonce = await api.query.system.accountNonce(keys.address);

    // Nonce show
    debug('setLeader', `Nonce: ${nonce.toString()}`);

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
            resolve(true);
          }
        }).catch(err => reject(err));
    });
  } catch (error) {
    debug('setLeader', error);
    throw error;
  }
};

module.exports = {
  connect,
  listenEvents,
  addMetrics,
  getLeader,
  setLeader
};
