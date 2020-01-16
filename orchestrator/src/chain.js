const { ApiPromise, WsProvider } = require('@polkadot/api');
const { getKeysFromSeed } = require('./utils');
const debug = require('debug')('chain');

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
        console.log(event.toString());
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
    // create, sign and send transaction
    await api.tx.archipelModule
      // create transaction
      .addMetrics(metrics)
      // Sign transcation
      .sign(keys, { nonce })
      // Send transaction
      .send(({ events = [], status }) => {
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

const setLeader = async (oldLeader, api, mnemonic) => {
  try {
    // Get keys from mnemonic
    const keys = getKeysFromSeed(mnemonic);

    // Get account nonce
    const nonce = await api.query.system.accountNonce(keys.address);

    return new Promise((resolve, reject) => {
      // create, sign and send transaction
      api.tx.archipelModule
        // create transaction
        .setMaster(oldLeader)
        // Sign and transcation
        .sign(keys, { nonce })
        // Send transaction
        .send(({ events = [], status }) => {
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
          } else {
            reject(new Error('Transaction failed.'));
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
