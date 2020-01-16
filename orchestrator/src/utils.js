const { Keyring } = require('@polkadot/keyring');

// Create a Keyring from seed
const getKeysFromSeed = function (_seed) {
  if (!_seed) {
    throw new Error('Provided wallet seed is not valid.');
  }
  const keyring = new Keyring({ type: 'sr25519' });
  return keyring.addFromUri(_seed);
};

module.exports = {
  getKeysFromSeed,
  throwIfMissing
};
