const { Keyring } = require('@polkadot/keyring');

// Create a Keyring from seed
const getKeysFromSeed = function (_seed) {
  if (!_seed) {
    throw new Error('Provided wallet seed is not valid.');
  }
  const keyring = new Keyring({ type: 'sr25519' });
  return keyring.addFromUri(_seed);
};

// Convert a stream to string
const streamToString = stream => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').replace(/[^\x20-\x7E]/g, '')));
  });
};

module.exports = {
  getKeysFromSeed,
  streamToString
};
