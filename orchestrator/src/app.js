const { connect, listenEvents, addMetrics, chainNodeInfo, initNonce } = require('./chain');
const { Metrics } = require('./metrics');
const { catchExitSignals } = require('./utils');
const { orchestrateService, serviceStart, serviceCleanUp } = require('./service');
const Docker = require('dockerode');
const debug = require('debug')('app');
const { setIntervalAsync } = require('set-interval-async/fixed');

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
    const api = await connect(NODE_WS);

    // Init global nonce
    await initNonce(api, MNEMONIC);

    // Create Docker instance
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

    // Create Metrics instance
    const metrics = new Metrics();

    // Start service in passive mode
    console.log('Starting service in passive mode...');
    await serviceStart(docker, SERVICE, 'passive');

    // Listen events
    listenEvents(api, metrics);

    // Add metrics every 10 seconds
    setIntervalAsync(async () => {
      try {
        const result = await addMetrics(api, 42, MNEMONIC);
        debug('main', `Result add metrics: ${result}`);
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Orchestrate service every 10 second
    setIntervalAsync(async () => {
      try {
        await orchestrateService(docker, api, metrics, MNEMONIC, ALIVE_TIME, SERVICE);
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Show metrics
    setInterval(() => { metrics.showMetrics(); }, 10000);

    // Show chain node info
    setIntervalAsync(async () => { 
      try {
        await chainNodeInfo(api); 
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Attach service cleanup to exit signals
    catchExitSignals(serviceCleanUp, docker, SERVICE);
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
