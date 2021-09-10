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

    // Create Heartbeats instance
    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    // Connect to Polkadot API
    console.log('Connecting to Archipel Chain node...');
    const heartbeatAddInterval = 10000;
    const chainInfoUpdateInterval = 10000;
    const chain = new Chain(config.nodeWs, heartbeats, config.nodeGroupId, config.mnemonic, heartbeatAddInterval, chainInfoUpdateInterval);

    // Create Orchestrator instance
    const orchestrationInterval = 10000;
    const orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats,
      orchestrationInterval);

    // Bootstrap orchestration before orchestration
    await orchestrator.bootstrapOrchestrator();

    // Bootstrap chain
    await chain.bootstrap(orchestrator);

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
