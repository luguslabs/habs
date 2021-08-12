const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const fs = require('fs-extra');

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

// Read json file content to object
const readToObj = path => {
  const fileContent = fs.readFileSync(path);
  return JSON.parse(fileContent);
};

// fromModeToNodeStatus
const fromModeToNodeStatus = mode => {
  if (mode === 'active') {
    return 1;
  }
  if (mode === 'passive') {
    return 2;
  }
  return 0;
};

// Cleanup on exit
const catchExitSignals = (cleanUpCallback) => {
  // catching signals and calling cleanup callback before exit
  ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
  ].forEach(sig => {
    process.on(sig, async () => {
      console.log('Received %s - terminating app ...', sig);
      // Waiting for cleanup to be finished
      await cleanUpCallback();
      // Exiting
      process.exit(1);
    });
  });
};

// Check is string is not set or is empty
const isEmptyString = (str) => {
  return (str === undefined || str.length === 0);
};

// Check is a variable is set
const checkVariable = (value, name) => {
  if (isEmptyString(value)) {
    throw Error(`Error! Variable ${name} was not set.`);
  }
  return true;
};

// Format option list permits to create telemetry url params and reserved nodes params
const formatOptionList = (option, inputList) => {
  if (option === '' || inputList === '') {
    return [];
  }
  return inputList.split(',').reduce((resultArray, item) => {
    resultArray.push(option);
    resultArray.push(item);
    return resultArray;
  }, []);
};

// Create a list of params from a string separated by a space
const formatOptionCmds = inputCmds => {
  if (!inputCmds) {
    return [];
  }
  if (inputCmds.split(' ').length === 1) {
    return [inputCmds];
  }
  return inputCmds.split(' ').reduce((resultArray, item) => {
    resultArray.push(item);
    return resultArray;
  }, []);
};

// Construct nodes list with wallets and nodes names
const constructNodesList = (nodesWallets, archipelName) => {
  if (isEmptyString(nodesWallets) || isEmptyString(archipelName)) {
    return [];
  }
  return nodesWallets.toString().split(',').reduce((resultArray, item, index) => {
    resultArray.push({
      wallet: item,
      name: `${archipelName.toString()}-NODE-${index + 1}`
    });
    return resultArray;
  }, []);
};

// Show transaction status in debug
const transactionGetStatus = (status) => {
  if (!status) return 'Failed to get status.';
  if (status.isInvalid) return 'Transaction is invalid.';
  if (status.isDropped) return 'Transaction is dropped.';
  if (status.isUsurped) return 'Transaction is usurped.';
  if (status.isReady) return 'Transaction is ready.';
  if (status.isFuture) return 'Transaction is future.';
  if (status.isFinalized) return 'Transaction is finalized.';
  if (status.isBroadcast) return 'Transaction is broadcast.';
  return 'Unknown transaction state.';
};

module.exports = {
  getKeysFromSeed,
  streamToString,
  catchExitSignals,
  isEmptyString,
  readToObj,
  checkVariable,
  formatOptionList,
  formatOptionCmds,
  constructNodesList,
  fromModeToNodeStatus,
  transactionGetStatus
};
