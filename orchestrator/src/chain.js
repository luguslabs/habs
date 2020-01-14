const { ApiPromise, WsProvider } = require('@polkadot/api');
const { getKeysFromSeed } = require('./utils');
const debug = require('debug')('orchestrator:chain');

const connect = async wsProvider => {
  // Creating Websocket Provider
  const provider = new WsProvider(wsProvider);

  // Create and return Polkadot API
  return ApiPromise.create(provider);
};

// Listen events
const listenEvents = (api, metrics) => {
  // Subscribe to events
  api.query.system.events((events) => {
    // Loop through events
    events.forEach(({ event, phase }) => {
      // Add metrics if Metrics updated event was recieved
      if (event.section.toString() === 'archipelModule' && event.method.toString() === 'MetricsUpdated') {
        console.log(`Recieved metrics updated event from ${event.data[0]}`);
        metrics.addMetrics(event.data[0], event.data[1], event.data[2]);
      }
    });
  });
};

// Send metrics
const addMetrics = async (metrics, api, mnemonic) => {
  try {
    // Get keys from mnemonic
    const keys = getKeysFromSeed(mnemonic);

    // Get account nonce
    const nonce = await api.query.system.accountNonce(keys.address);

    // create, sign and send transaction
    return await api.tx.archipelModule
      // create transaction
      .addMetrics(metrics)
      // Sign transcation
      .sign(keys, { nonce })
      // Send transaction
      .send(({ events = [], status }) => {
        if (status.isFinalized) {
          events.forEach(async ({ phase, event: { data, method, section } }) => {
            if (section.toString() === 'archipelModule' && method.toString() === 'MetricsUpdated') {
              // show metadata for debug
              console.log('Transaction was successfully sent and generated an event.');
              console.log(JSON.parse(data.toString()));
            }
          });
        }
      });
  } catch (error) {
    debug('addMetrics', error);
    throw error;
  }
};

// Get current leader from Runtime
const getLeader = async api => {
  return api.query.archipelModule.master();
};

const setLeader = async (oldLeader, api, mnemonic) => {
  // Get keys from mnemonic
  const keys = getKeysFromSeed(mnemonic);

  // Get account nonce
  const nonce = await api.query.system.accountNonce(keys.address);

  // create, sign and send transaction
  return api.tx.archipelModule
    // create transaction
    .setMaster(oldLeader)
    // Sign transcation
    .sign(keys, { nonce })
    // Send transaction
    .send(({ events = [], status }) => {
      if (status.isFinalized) {
        events.forEach(async ({ phase, event: { data, method, section } }) => {
          // check if the add metrics event was emitted by Substrate runtime
          if (section.toString() === 'archipelModule' && method.toString() === 'NewMaster') {
            // show metadata for debug
            console.log('Transaction was successfully sent and generated an event.');
            console.log(JSON.parse(data.toString()));
          }
        });
      }
    });
};

module.exports = {
  connect,
  listenEvents,
  addMetrics,
  getLeader,
  setLeader
};
