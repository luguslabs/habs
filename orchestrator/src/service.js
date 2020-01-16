const { getLeader, setLeader } = require('./chain.js');
const { getKeysFromSeed } = require('./utils');
const { polkadotStart } = require('./polkadot');
const debug = require('debug')('service');

const orchestrateService = async (api, metrics, mnemonic) => {
  try {
    console.log('Orchestrating service.....');
    // Get node address from seed
    const nodeKey = getKeysFromSeed(mnemonic).address;
    console.log(`Current node key: ${nodeKey}`);

    // Get current leader from chain
    let currentLeader = await getLeader(api);
    currentLeader = currentLeader.toString();

    // If current leader is already set
    if (currentLeader !== '') {
      console.log(`Current Leader: ${currentLeader}`);
      // If you are the current leader
      if (currentLeader === nodeKey) {
        console.log('Launching validator node...');
        await serviceStart('polkadot', 'validate');

      // If someone else is leader
      } else {
        // Get validator metrics known
        const validatorMetrics = metrics.getMetrics(currentLeader);
        // If validator already sent an Metrics Update
        if (validatorMetrics !== undefined) {
          const nowTime = new Date().getTime();
          const lastSeenAgo = nowTime - validatorMetrics.timestamp;
          // Checking if it can be considered alive
          if (lastSeenAgo > 60000) {
            console.log('Leader is not alive for 1min...');
            await becomeLeader(nodeKey, api, mnemonic);
          } else {
            console.log('All is OK leader is alive...');
          }
        // If there is no metrics about validator we will set timestamp and metrics to 0
        } else {
          console.log('No info about validator...');
          console.log('Adding empty info about current leader and doing nothing...');
          metrics.addMetrics(currentLeader, 0, 0);
        }
      }
    // Leader is not already set (first time boot)
    } else {
      console.log('There is no leader set...');
      await becomeLeader(nodeKey, api, mnemonic);
    }
  } catch (error) {
    debug('orchestrateService', error);
    console.error(error);
  }
};

const becomeLeader = async (nodeKey, api, mnemonic) => {
  try {
    console.log('Trying to be leader...');
    const leaderSet = await setLeader(nodeKey, api, mnemonic);

    if (leaderSet === true) {
      console.log('Leader was successfully set.');
      console.log('Launching validator node...');
      await serviceStart('polkadot', 'validate');
    } else {
      console.log('Can\'t set leader.');
      console.log('Someone is already leader...');
    }
  } catch (error) {
    debug('becomeLeader', error);
    throw error;
  }
};

const serviceStart = async (name, mode) => {
  try {
    // If service is Polkadot launching it
    if (name === 'polkadot') {
      await polkadotStart(mode);
    } else {
      throw Error(`Service ${name} is not supported yet.`);
    }
  } catch (error) {
    debug('serviceStart', error);
    throw error;
  }
};

module.exports = {
  orchestrateService,
  serviceStart
};
