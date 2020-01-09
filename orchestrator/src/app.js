const { NODE_WS, MNEMONIC } = process.env;
const { connect, listenEvents, addMetrics } = require('./chain');

// Main function
async function main () {
  // Connection to Polkadot API
  const api = await connect(NODE_WS);

  // Listening events
  listenEvents(api);

  // Adding metrics every 10 seconds
  setInterval(addMetrics, 10000, 99, api, MNEMONIC);
}

main();
