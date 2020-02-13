const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

// Create a Keyring from seed
const getKeysFromSeed = async (_seed, type = 'sr25519') => {
  if (!_seed) {
    throw new Error('Provided wallet seed is not valid.');
  }
  await cryptoWaitReady();
  const keyring = new Keyring({ type });
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

// Cleanup on exit
const catchExitSignals = (cleanUpCallback, docker, service) => {
  // catching signals and calling cleanup callback before exit
  ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
  ].forEach(sig => {
    process.on(sig, async () => {
      if (typeof sig === 'string') {
        console.log('Received %s - terminating app ...', sig);
        // Waiting for cleanup to be finished
        await cleanUpCallback(docker, service);
        // Exiting
        process.exit(1);
      }
    });
  });
};

const isEmptyString = (str) => {
  return (!str || str.length === 0);
};

module.exports = {
  getKeysFromSeed,
  streamToString,
  catchExitSignals,
  isEmptyString
};
