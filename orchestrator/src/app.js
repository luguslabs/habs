const { setIntervalAsync } = require('set-interval-async/fixed');

const { Chain } = require('./chain');
const { Metrics } = require('./metrics');
const { catchExitSignals } = require('./utils');
const { Polkadot } = require('./polkadot');
const { Docker } = require('./docker');
const { orchestrateService, serviceStart, serviceCleanUp } = require('./service');

const debug = require('debug')('app');

// Import env variables from .env file
const dotenv = require('dotenv');
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

    // Create Docker instance
    const docker = new Docker();
    // Create Metrics instance
    const metrics = new Metrics();

    // Create service instance
    let service;
    if (SERVICE === 'polkadot') {
      service = new Polkadot(docker);
    } else {
      throw Error(`Service ${service} is not supported yet.`);
    }

    // Start service in passive mode
    console.log('Starting service in passive mode...');
    await serviceStart(service, 'passive');

    // Listen events
    chain.listenEvents(metrics, MNEMONIC);

    // Add metrics and orchestrate every 10 seconds
    setIntervalAsync(async () => {
      try {
        await chain.addMetrics(42, MNEMONIC);
        await orchestrateService(chain, metrics, MNEMONIC, ALIVE_TIME, service);
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

    // Attach service cleanup to exit signals
    catchExitSignals(serviceCleanUp, service);
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
