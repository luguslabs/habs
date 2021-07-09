const { setIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('app');
const dotenv = require('dotenv');

const { Chain } = require('./chain');
const { Heartbeats } = require('./heartbeats');
const {
  catchExitSignals,
  checkVariable
} = require('./utils');
const { Orchestrator } = require('./orchestrator');
const {
  initApi,
  initApiSms
} = require('./api');
const { Stonith } = require('./stonith');

// Construct configuration from env variables
const constructConfiguration = () => {
  // Import env variables from .env file
  dotenv.config();
  const config = {};
  config.nodeWs = process.env.NODE_WS;
  config.mnemonic = process.env.MNEMONIC;
  config.aliveTime = process.env.ALIVE_TIME;
  config.service = process.env.SERVICES;
  config.serviceMode = process.env.ARCHIPEL_SERVICE_MODE;
  config.heartbeatEnabled = process.env.ARCHIPEL_HEARTBEATS_ENABLE;
  config.nodesWallets = process.env.NODES_WALLETS;
  config.archipelName = process.env.ARCHIPEL_NAME;
  config.nodeGroup = process.env.NODE_GROUP;
  config.nodeGroupId = process.env.NODE_GROUP_ID;

  // Setting default values for variables
  if (!config.heartbeatEnabled || !config.heartbeatEnabled.includes('false')) {
    config.heartbeatEnabled = true;
  }
  config.orchestrationEnabled = process.env.ARCHIPEL_ORCHESTRATION_ENABLE;
  if (!config.orchestrationEnabled || !config.orchestrationEnabled.includes('false')) {
    config.orchestrationEnabled = true;
  }

  Object.keys(config).forEach(key => {
    checkVariable(config[key], `${key}`);
  });

  return config;
};

// Main function
async function main () {
  try {
    // Create configuration
    const config = constructConfiguration();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(config);
    await chain.connect();

    // Create Heartbeats instance
    const heartbeats = new Heartbeats(config);

    // Create Stonith instance
    const stonith = new Stonith();

    // Create Orchestrator instance
    const orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats,
      stonith);

    // Start service before orchestration
    await orchestrator.bootstrapService();

    // Attach orchestrator to stonith
    stonith.orchestrator = orchestrator;

    // Create chain event listener
    chain.listenEvents(heartbeats, orchestrator);

    // Add heartbeats every 10 seconds
    setIntervalAsync(async () => {
      try {
        await chain.addHeartbeat(orchestrator.service.mode);
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
