const { connect, listenEvents, addMetrics } = require('./chain');
const { Metrics } = require('./metrics');
const { orchestrateService, serviceStart } = require('./service');

// Import env variables from .env file
const dotenv = require('dotenv');
dotenv.config();
const { NODE_WS, MNEMONIC } = process.env;

// Catch SIGINT and exit
process.on('SIGINT', function () {
  process.exit();
});

// Main function
async function main () {
  // Checking env variables
  if (NODE_WS === undefined || MNEMONIC === undefined) {
    throw Error('Archipel needs at least NODE_WS and MNEMONIC variables to work.');
  }

  // Connection to Polkadot API
  console.log('Connecting to Archipel Chain node...');
  const api = await connect(NODE_WS);

  // Starting service in passive mode
  console.log('Starting service in passive mode...');
  await serviceStart('polkadot', 'passive');
  console.log('Service was started in passive mode...');

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

main().catch(console.error);
