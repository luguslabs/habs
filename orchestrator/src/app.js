const { setIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('app');

const { Chain } = require('./chain');
const { Heartbeats } = require('./heartbeats');
const { catchExitSignals } = require('./utils');
const { Orchestrator } = require('./orchestrator');
const { initApi } = require('./api');
const { constructConfiguration } = require('./config');

// Main function
async function main () {
  try {
    // Create configuration
    const config = constructConfiguration();

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const chain = new Chain(config.nodeWs);
    await chain.connect();

    // Create Heartbeats instance
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    // Create Orchestrator instance
    const orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats);

    // Bootstrap orchestration before orchestration
    await orchestrator.bootstrapOrchestrator();

    // Create chain event listener
    chain.listenEvents(heartbeats, orchestrator, orchestrator.mnemonic);

    // Add heartbeats every 10 seconds
    setIntervalAsync(async () => {
      try {
        // Checking if heartbeats send is enabled
        console.log('Checking if heartbeats send is enabled...');
        if (!orchestrator.heartbeatSendEnabled || !orchestrator.heartbeatSendEnabledAdmin) {
          console.log('Heartbeat send is disabled...');
          return;
        }
        await chain.addHeartbeat(orchestrator.service.mode, orchestrator.mnemonic, orchestrator.nodeGroupId);
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

    // Printing end message
    console.log('Orchestrator was successfully launched...');
  } catch (error) {
    debug('main', error);
    console.error(error);
    process.exit();
  }
}

main();