const { setIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('app');
const dotenv = require('dotenv');

const { Chain } = require('./chain');
const { Metrics } = require('./metrics');
const { catchExitSignals } = require('./utils');
const { Orchestrator } = require('./orchestrator');

// Import env variables from .env file
dotenv.config();
const {
  NODE_WS,
  MNEMONIC,
  ALIVE_TIME,
  SERVICE
} = process.env;

// Check if all necessary env vars were set
const checkEnvVars = () => {
  try {
    // Checking env variables
    if (NODE_WS === undefined || MNEMONIC === undefined || ALIVE_TIME === undefined || SERVICE === undefined) {
      throw Error('Archipel needs at least NODE_WS, MNEMONIC, ALIVE_TIME, SERVICE variables to work.');
    }
  } catch (error) {
    debug('checkEnvVars', error);
    console.error(error);
  }
};

// Main function
async function main () {
  try {
    // Checking env variables
    checkEnvVars();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(NODE_WS);
    await chain.connect();

    // Create Metrics instance
    const metrics = new Metrics();

    // Create orchestrator instance
    const orchestrator = new Orchestrator(chain, SERVICE, metrics, MNEMONIC, ALIVE_TIME);

    // Start service in passive mode
    console.log('Starting service in passive mode...');
    await orchestrator.serviceStart('passive');

    // Listen events
    chain.listenEvents(metrics, orchestrator, MNEMONIC);

    // Add metrics and orchestrate every 10 seconds
    setIntervalAsync(async () => {
      try {
        await chain.addMetrics(42, MNEMONIC);
        await orchestrator.orchestrateService();
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Show metrics
    setInterval(() => { metrics.showMetrics(); }, 10000);

    // Show chain node info
    setIntervalAsync(async () => {
      try {
        await chain.chainNodeInfo();
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Checking if the orchestrator is connected to chain every 5 secs
    setIntervalAsync(async () => {
      try {
        if (!chain.isConnected()) {
          console.log('Warning! Connection with chain was lost...');
          console.log('Enforcing passive mode for service...');
          await orchestrator.serviceStart('passive');
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    // Attach service cleanup to exit signals
    catchExitSignals(orchestrator.serviceCleanUp.bind(orchestrator));
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
