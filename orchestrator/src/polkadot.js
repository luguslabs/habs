const { startServiceContainer } = require('./docker');

// Working with env variables
const dotenv = require('dotenv');
dotenv.config();
const { POLKADOT_NAME, POLKADOT_KEY, POLKADOT_IMAGE } = process.env;

// Polkadot start function
const polkadotStart = async (action) => {
  // Checking if variables where set
  if (POLKADOT_NAME === undefined || POLKADOT_KEY === undefined || POLKADOT_IMAGE === undefined) {
    throw Error('Polkadot Service needs POLKADOT_NAME, POLKADOT_KEY, POLKADOT_IMAGE env variables set.');
  }

  // Actions
  if (action === 'validate') {
    await startServiceContainer('active', 'polkadot-validator', 'polkadot-sync', POLKADOT_IMAGE, ['polkadot', '--chain', 'alex', '--name', POLKADOT_NAME, '--validator', '--key', POLKADOT_KEY], '/root/.local/share/polkadot', 'polkadot-volume');
  } else {
    await startServiceContainer('passive', 'polkadot-validator', 'polkadot-sync', POLKADOT_IMAGE, ['polkadot', '--chain', 'alex', '--name', POLKADOT_NAME], '/root/.local/share/polkadot', 'polkadot-volume');
  }
};

module.exports = {
  polkadotStart
};
