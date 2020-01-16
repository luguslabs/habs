const { connect, listenEvents, addMetrics } = require('./chain');
const { Metrics } = require('./metrics');
const { orchestrateService, serviceStart } = require('./service');
const debug = require('debug')('app');

// Import env variables from .env file
const dotenv = require('dotenv');
dotenv.config();
const { NODE_WS, MNEMONIC, ALIVE_TIME } = process.env;

// Catch SIGINT and exit
process.on('SIGINT', function () {
  process.exit();
});

// Main function
async function main () {
  try {
    // Checking env variables
    if (NODE_WS === undefined || MNEMONIC === undefined || ALIVE_TIME === undefined) {
      throw Error('Archipel needs at least NODE_WS, MNEMONIC, ALIVE_TIME variables to work.');
    }

    // Connection to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const api = await connect(NODE_WS);

    // Starting service in passive mode
    console.log('Starting service in passive mode...');
    await serviceStart('polkadot', 'sync');
    console.log('Service was started in passive mode...');

    // Creating metrics object
    const metrics = new Metrics();

    // Listening events and filling metrics object
    listenEvents(api, metrics);

    // Adding metrics every 20 seconds
    setInterval(addMetrics, 20000, 42, api, MNEMONIC);

    // Orchestrate service every 30 seconds
    setInterval(orchestrateService, 30000, api, metrics, MNEMONIC, ALIVE_TIME);

    // Showing metrics just for debug
    setInterval(() => { metrics.showMetrics(); }, 5000);
  } catch (error) {
    debug('main', error);
    console.error(error);
  }
}

main();
