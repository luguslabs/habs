const { setIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('app');
const dotenv = require('dotenv');

const { Chain } = require('./chain');
const { Metrics } = require('./metrics');
const {
  catchExitSignals,
  checkVariable,
  constructNodesList
} = require('./utils');
const { Orchestrator } = require('./orchestrator');
const {
  initApi
} = require('./api');

// Import env variables from .env file
dotenv.config();
const {
  NODE_WS,
  MNEMONIC,
  ALIVE_TIME,
  SERVICE,
  SUSPEND_SERVICE,
  NODES_WALLETS,
  ARCHIPEL_NAME,
  NODE_ROLE,
  NODES_ROLE
} = process.env;

// Check if all necessary env vars were set
const checkEnvVars = () => {
  try {
    checkVariable(NODE_WS, 'NODE_WS');
    checkVariable(MNEMONIC, 'MNEMONIC');
    checkVariable(ALIVE_TIME, 'ALIVE_TIME');
    checkVariable(SERVICE, 'SERVICE');
    checkVariable(ARCHIPEL_NAME, 'ARCHIPEL_NAME');
    checkVariable(NODES_WALLETS, 'NODES_WALLETS');
    checkVariable(NODE_ROLE, 'NODE_ROLE');
    checkVariable(NODES_ROLE, 'NODES_ROLE');
  } catch (error) {
    debug('checkEnvVars', error);
    throw error;
  }
};

// Main function
async function main () {
  try {
    // Checking env variables
    checkEnvVars();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(NODE_WS, NODE_ROLE);
    await chain.connect();

    // Construct nodes list
    const nodes = constructNodesList(NODES_WALLETS, ARCHIPEL_NAME);

    // Create Metrics instance
    const metrics = new Metrics(nodes);

    // Create orchestrator instance
    const orchestrator = new Orchestrator(chain, SERVICE, metrics, MNEMONIC, ALIVE_TIME, ARCHIPEL_NAME, NODE_ROLE);

    // If orchestrator is launched in suspend service mode disabling metrics send and orchestration
    if (SUSPEND_SERVICE.includes('true')) {
      orchestrator.chain.metricSendEnabledAdmin = false;
      orchestrator.orchestrationEnabled = false;
    }

    // Start service in passive mode
    console.log('Starting service in passive or sentry mode...');
    await orchestrator.serviceStart(NODE_ROLE === 'operator' ? 'passive' : 'sentry');

    // Listen events
    chain.listenEvents(metrics, orchestrator, MNEMONIC);

    // Add metrics and orchestrate every 10 seconds
    setIntervalAsync(async () => {
      try {
        // If metric send is enabled sending metrics
        const metricsValue = (NODE_ROLE === 'operator') ? 1 : 2;

        await chain.addMetrics(metricsValue, MNEMONIC);
        // Orchestrating service
        await orchestrator.orchestrateService();
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Checking if the orchestrator is connected to chain every 5 secs
    setIntervalAsync(async () => {
      try {
        if (!chain.isConnected()) {
          console.log('Warning! Connection with chain was lost...');
          console.log('Enforcing passive mode or sentry for service...');
          await orchestrator.serviceStart(NODE_ROLE === 'operator' ? 'passive' : 'sentry');
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    // Attach service cleanup to exit signals
    catchExitSignals(orchestrator.serviceCleanUp.bind(orchestrator));

    // Init api
    initApi(orchestrator);

    // Printing end message
    console.log('Orchestrator was successfully launched...');
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
