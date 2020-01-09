const { NODE_WS, MNEMONIC } = process.env;
const { connect, listenEvents, addMetrics } = require('./chain');

// Catch SIGINT and exit
process.on('SIGINT', function() {
  process.exit();
});

// Main function
async function main () {
  // Connection to Polkadot API
  const api = await connect(NODE_WS);

  // Listening events
  listenEvents(api);

  // Adding metrics every 10 seconds
  setInterval(addMetrics, 10000, 42, api, MNEMONIC);
}

main();
