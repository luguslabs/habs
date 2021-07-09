const { setIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('app');
const dotenv = require('dotenv');

const { Chain } = require('./chain');
const { Heartbeats } = require('./heartbeats');
const {
  catchExitSignals,
  checkVariable,
  constructNodesList
} = require('./utils');
const { Orchestrator } = require('./orchestrator');
const {
  initApi,
  initApiSms
} = require('./api');
const { Stonith } = require('./stonith');

// Import env variables from .env file
dotenv.config();
const {
  NODE_WS,
  MNEMONIC,
  ALIVE_TIME,
  SERVICES,
  ARCHIPEL_SERVICE_MODE,
  ARCHIPEL_HEARTBEATS_ENABLE,
  ARCHIPEL_ORCHESTRATION_ENABLE,
  NODES_WALLETS,
  ARCHIPEL_NAME,
  NODE_GROUP,
  NODE_GROUP_ID
} = process.env;

// Check if all necessary env vars were set
const checkEnvVars = () => {
  try {
    checkVariable(NODE_WS, 'NODE_WS');
    checkVariable(MNEMONIC, 'MNEMONIC');
    checkVariable(ALIVE_TIME, 'ALIVE_TIME');
    checkVariable(SERVICES, 'SERVICES');
    checkVariable(SERVICES, 'ARCHIPEL_SERVICE_MODE');
    checkVariable(SERVICES, 'ARCHIPEL_HEARTBEATS_ENABLE');
    checkVariable(SERVICES, 'ARCHIPEL_ORCHESTRATION_ENABLE');
    checkVariable(NODES_WALLETS, 'NODES_WALLETS');
    checkVariable(ARCHIPEL_NAME, 'ARCHIPEL_NAME');
    checkVariable(NODE_GROUP, 'NODE_GROUP');
    checkVariable(NODE_GROUP_ID, 'NODE_GROUP_ID');
  } catch (error) {
    debug('checkEnvVars', error);
    throw error;
  }
};

// Bootstrap service at boot
async function bootstrapService (orchestrator) {
  // Start service before orchestration
  if (ARCHIPEL_SERVICE_MODE === 'orchestrator' || ARCHIPEL_SERVICE_MODE === 'passive') {
    console.log(`ARCHIPEL_SERVICE_MODE is ${ARCHIPEL_SERVICE_MODE}. Starting service in passive...`);
    await orchestrator.service.serviceStart('passive');
  } else if (ARCHIPEL_SERVICE_MODE === 'active') {
    console.log('ARCHIPEL_SERVICE_MODE is force as active mode...');
    await orchestrator.service.serviceStart('active');
  } else {
    throw Error('Unkown ARCHIPEL_SERVICE_MODE. Shutting down...');
  }
}

// Main function
async function main () {
  try {
    // Checking env variables
    checkEnvVars();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(NODE_WS, ARCHIPEL_HEARTBEATS_ENABLE);
    await chain.connect();

    // Construct nodes list
    const nodes = constructNodesList(NODES_WALLETS, ARCHIPEL_NAME);

    // Create Heartbeats instance
    const heartbeats = new Heartbeats(nodes);

    // Create stonith instance
    const stonith = new Stonith();

    // Create orchestrator instance
    const orchestrator = new Orchestrator(
      chain,
      SERVICES,
      heartbeats,
      MNEMONIC,
      ALIVE_TIME,
      ARCHIPEL_NAME,
      ARCHIPEL_SERVICE_MODE,
      NODE_GROUP_ID,
      ARCHIPEL_ORCHESTRATION_ENABLE,
      stonith);

    // Start service before orchestration
    await bootstrapService(orchestrator);

    // Attach orchestrator to stonith
    stonith.orchestrator = orchestrator;

    // Create chain event listener
    chain.listenEvents(heartbeats, orchestrator, MNEMONIC);

    // Add heartbeats every 10 seconds
    setIntervalAsync(async () => {
      try {
        await chain.addHeartbeat(NODE_GROUP_ID, orchestrator.service.mode, MNEMONIC);
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    // Orchestrate every 10 seconds
    setIntervalAsync(async () => {
      try {
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
          console.log('Enforcing passive mode for service...');
          await orchestrator.service.serviceStart('passive');
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    // Attach service cleanup to exit signals
    catchExitSignals(orchestrator.service.serviceCleanUp.bind(orchestrator));

    // Init api
    initApi(orchestrator);
    initApiSms(orchestrator);

    // Printing end message
    console.log('Orchestrator was successfully launched...');
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();
