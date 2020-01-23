const { connect, listenEvents, addMetrics, chainNodeInfo } = require('./chain');
const { Metrics } = require('./metrics');
const { catchExitSignals } = require('./utils');
const { orchestrateService, serviceStart, serviceCleanUp } = require('./service');
const Docker = require('dockerode');
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

    // Connection to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const api = await connect(NODE_WS, MNEMONIC);

    // Creating Docker instance
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

    // Attach service cleaup to exit signals
    catchExitSignals(serviceCleanUp, docker, SERVICE);

    // Creating Metrics instance
    const metrics = new Metrics();

    // Starting service in passive mode
    console.log('Starting service in passive mode...');
    await serviceStart(docker, SERVICE, 'passive');
    console.log('Service was started in passive mode...');

    // Listening events and filling metrics object
    listenEvents(api, metrics);

    // Adding metrics every 10 seconds
    setInterval(addMetrics, 10000, api, 42, MNEMONIC);

    // Orchestrate service every 20 seconds
    setInterval(orchestrateService, 20000, docker, api, metrics, MNEMONIC, ALIVE_TIME, SERVICE);

    // Showing metrics just for debug
    setInterval(() => { metrics.showMetrics(); }, 10000);

    // Showing chain node info
    setInterval(chainNodeInfo, 10000, api);
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
