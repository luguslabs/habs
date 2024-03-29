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
    chain.listenEvents(heartbeats, config.mnemonic, orchestrator);

    // Add heartbeats every 10 seconds
    setIntervalAsync(async () => {
      try {
        // Checking if heartbeats send is enabled
        console.log('Checking if heartbeats send is enabled...');
        if (!orchestrator.heartbeatSendEnabled || !orchestrator.heartbeatSendEnabledAdmin) {
          console.log('Heartbeat send is disabled...');
          return;
        }
        await chain.addHeartbeat(orchestrator.getServiceMode(), config.mnemonic, config.nodeGroupId);
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
