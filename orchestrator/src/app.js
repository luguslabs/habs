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
  initApi
} = require('./api');
const {
  initApiSms
} = require('./apiSms');

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
  NODE_ROLE,
  NODE_GROUP,
  NODE_GROUP_ID,
  NODES_ROLE,
  SMS_STONITH_ACTIVE,
  SMS_STONITH_CALLBACK_MANDATORY,
  SMS_STONITH_CALLBACK_MAX_DELAY,
  AUTHORITIES_LIST,
  NEXMO_API_KEY,
  NEXMO_API_SECRET,
  NEXMO_API_SIGNATURE_METHOD,
  NEXMO_API_SIGNATURE_SECRET,
  NEXMO_API_CHECK_MSG_SIGNATURE,
  NEXMO_PHONE_NUMBER,
  OUTLET_PHONE_NUMBER_LIST
} = process.env;

// Check if all necessary env vars were set
const checkEnvVars = () => {
  try {
    checkVariable(NODE_WS, 'NODE_WS');
    checkVariable(MNEMONIC, 'MNEMONIC');
    checkVariable(ALIVE_TIME, 'ALIVE_TIME');
    checkVariable(SERVICES, 'SERVICES');
    checkVariable(ARCHIPEL_NAME, 'ARCHIPEL_NAME');
    checkVariable(NODES_WALLETS, 'NODES_WALLETS');
    checkVariable(NODE_ROLE, 'NODE_ROLE');
    checkVariable(NODE_GROUP, 'NODE_GROUP');
    checkVariable(NODE_GROUP_ID, 'NODE_GROUP_ID');
    checkVariable(NODES_ROLE, 'NODES_ROLE');
    checkVariable(SMS_STONITH_ACTIVE, 'SMS_STONITH_ACTIVE');
    checkVariable(SMS_STONITH_CALLBACK_MANDATORY, 'SMS_STONITH_CALLBACK_MANDATORY');
    checkVariable(SMS_STONITH_CALLBACK_MAX_DELAY, 'SMS_STONITH_CALLBACK_MAX_DELAY');
    checkVariable(NEXMO_API_CHECK_MSG_SIGNATURE, 'NEXMO_API_CHECK_MSG_SIGNATURE');
    checkVariable(AUTHORITIES_LIST, 'AUTHORITIES_LIST');
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
    await orchestrator.serviceStart('passive');
  } else if (ARCHIPEL_SERVICE_MODE === 'active') {
    console.log('ARCHIPEL_SERVICE_MODE is force as active mode...');
    await orchestrator.serviceStart('active');
  } else{
    throw Error("Unkown ARCHIPEL_SERVICE_MODE. Shutting down...")
  }
}

// Main function
async function main () {
  try {
    // Checking env variables
    checkEnvVars();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(NODE_WS, NODE_ROLE, ARCHIPEL_HEARTBEATS_ENABLE);
    await chain.connect();

    // Construct nodes list
    const nodes = constructNodesList(NODES_WALLETS, ARCHIPEL_NAME);

    // Create Heartbeats instance
    const heartbeats = new Heartbeats(nodes);

    // Create orchestrator instance
    const orchestrator = new Orchestrator(
      chain,
      SERVICES,
      heartbeats,
      MNEMONIC,
      ALIVE_TIME,
      ARCHIPEL_NAME,
      ARCHIPEL_SERVICE_MODE,
      NODE_ROLE,
      NODE_GROUP_ID,
      SMS_STONITH_ACTIVE,
      SMS_STONITH_CALLBACK_MANDATORY,
      SMS_STONITH_CALLBACK_MAX_DELAY,
      NEXMO_API_KEY,
      NEXMO_API_SECRET,
      NEXMO_API_SIGNATURE_METHOD,
      NEXMO_API_SIGNATURE_SECRET,
      NEXMO_API_CHECK_MSG_SIGNATURE,
      NEXMO_PHONE_NUMBER,
      OUTLET_PHONE_NUMBER_LIST,
      AUTHORITIES_LIST,
      ARCHIPEL_ORCHESTRATION_ENABLE);

    // Start service before orchestration
    await bootstrapService(orchestrator);

    // Create chain event listener
    chain.listenEvents(heartbeats, orchestrator, MNEMONIC);

    // Add heartbeats every 10 seconds
    setIntervalAsync(async () => {
      try {
        await chain.addHeartbeat(NODE_GROUP_ID, orchestrator.mode, MNEMONIC);
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
          console.log('Enforcing passive mode or sentry for service...');
          await orchestrator.serviceStart('passive');
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    // Attach service cleanup to exit signals
    catchExitSignals(orchestrator.serviceCleanUp.bind(orchestrator));

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
