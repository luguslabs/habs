const { ApiPromise, WsProvider } = require('@polkadot/api');
const { getKeysFromSeed } = require('./utils');

const connect = async function (wsProvider) {
  // Creating Websocket Provider
  const provider = new WsProvider(wsProvider);

  // Create and return Polkadot API
  return ApiPromise.create(provider);
};

const listenEvents = async function (api) {
  // Subscribe to system events
  api.query.system.events((events) => {
    console.log(`\nReceived ${events.length} events:`);

    // Loop through events
    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;

      // Show event info
      console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      console.log(`\t\t${event.meta.documentation.toString()}`);

      // Loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      });
    });
  });
};

const addMetrics = async function (metrics, api, mnemonic) {
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
    .send(transationSent);
};

const transationSent = ({ events = [], status }) => {
  if (status.isFinalized) {
    console.log(status.asFinalized.toHex());

    events.forEach(async ({ phase, event: { data, method, section } }) => {
      console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
      // check if the add metrics event was emitted by Substrate runtime
      if (section.toString() === 'archipelModule' && method.toString() === 'MetricsUpdated') {
        // show metadata
        console.log(JSON.parse(data.toString()));
      }
    });
  }
};

module.exports = {
  connect,
  listenEvents,
  addMetrics
};
