const { NODE_WS, MNEMONIC } = process.env;
const { connect, listenEvents, addMetrics } = require('./chain');
const { Metrics } = require('./metrics');
const { orchestrateService } = require('./service');

// Catch SIGINT and exit
process.on('SIGINT', function () {
  process.exit();
});

// Main function
async function main () {
  // Connection to Polkadot API
  const api = await connect(NODE_WS);

  // Creating metrics object
  const metrics = new Metrics();

  // Listening events and filling metrics object
  listenEvents(api, metrics);

  // Adding metrics every 10 seconds
  setInterval(addMetrics, 10000, 42, api, MNEMONIC);

  // Orchestrate service every 10 seconds
  setInterval(orchestrateService, 10000, api, metrics, MNEMONIC);

  // Showing metrics just for debug
  setInterval(() => { metrics.showMetrics(); }, 5000);
}

main().catch(error => console.error('Error: ' + error));
