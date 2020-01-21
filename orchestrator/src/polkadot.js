const { startServiceContainer, dockerExecute } = require('./docker');
const debug = require('debug')('polkadot');

// Import env variables from .env file
const dotenv = require('dotenv');
dotenv.config();
const {
  POLKADOT_NAME,
  POLKADOT_KEY,
  POLKADOT_IMAGE,
  POLKADOT_PREFIX
} = process.env;

// Checking if necessary env vars were set
const checkEnvVars = () => {
  try {
    // Checking if all necessary variables where set
    if (POLKADOT_NAME === undefined || POLKADOT_KEY === undefined || POLKADOT_IMAGE === undefined || POLKADOT_PREFIX === undefined) {
      throw Error('Polkadot Service needs POLKADOT_NAME, POLKADOT_KEY, POLKADOT_IMAGE, POLKADOT_PREFIX env variables set.');
    }
  } catch (error) {
    debug('checkEnvVars', error);
    throw error;
  }
};

// Import wallets to polkadot keystore
const polkadotWalletsImport = async (docker, containerName) => {
  console.log('Importing wallets to keystore');
  const result = await dockerExecute(docker, containerName, ['polkadot', '--version']);
  console.log(result);
};

// Polkadot start function
const polkadotStart = async (docker, mode) => {
  try {
    // Checking if all necessary variables where set
    checkEnvVars();

    // Launch service in specific mode
    if (mode === 'active') {
      await startServiceContainer(docker, 'active', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['polkadot', '--chain', 'alex', '--name', POLKADOT_NAME, '--validator', '--key', POLKADOT_KEY], '/root/.local/share/polkadot', POLKADOT_PREFIX + 'polkadot-volume');
      await polkadotWalletsImport(docker, POLKADOT_PREFIX + 'polkadot-validator');
    } else if (mode === 'passive') {
      await startServiceContainer(docker, 'passive', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['polkadot', '--chain', 'alex', '--name', POLKADOT_NAME], '/root/.local/share/polkadot', POLKADOT_PREFIX + 'polkadot-volume');
      await polkadotWalletsImport(docker, POLKADOT_PREFIX + 'polkadot-sync');
    } else {
      throw new Error(`Mode '${mode}' is unknown.`);
    }
  } catch (error) {
    debug('polkadotStart', error);
    throw error;
  }
};

module.exports = {
  polkadotStart
};
