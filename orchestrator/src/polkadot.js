const { startServiceContainer, dockerExecute, removeContainer } = require('./docker');
const debug = require('debug')('polkadot');
const { getKeysFromSeed } = require('./utils');
const { u8aToHex } = require('@polkadot/util');

// Cleaning up variable
let cleaningUp = false;

// Imported key list
const importedKeys = [];

// Import env variables from .env file
const dotenv = require('dotenv');
dotenv.config();
const {
  POLKADOT_NAME,
  POLKADOT_IMAGE,
  POLKADOT_PREFIX,
  POLKADOT_KEY_GRAN,
  POLKADOT_KEY_BABE,
  POLKADOT_KEY_IMON,
  POLKADOT_KEY_PARA,
  POLKADOT_KEY_AUDI
} = process.env;

// Checking if necessary env vars were set
const checkEnvVars = () => {
  try {
    // Checking if all necessary variables where set
    if (POLKADOT_NAME === undefined || POLKADOT_IMAGE === undefined ||
        POLKADOT_PREFIX === undefined || POLKADOT_KEY_GRAN === undefined ||
        POLKADOT_KEY_BABE === undefined || POLKADOT_KEY_PARA === undefined ||
        POLKADOT_KEY_IMON === undefined || POLKADOT_KEY_AUDI === undefined) {
      throw Error('Polkadot Service needs POLKADOT_[NAME, KEY, IMAGE, PREFIX], POLKADOT_KEY_[GRAN, BABE, IMON, PARA, AUDI] env variables set.');
    }
  } catch (error) {
    debug('checkEnvVars', error);
    throw error;
  }
};

// Importing a key in keystore
const importAKey = async (docker, containerName, mnemonic, crypto, type) => {
  try {
    // Get public key hex from mnemonic
    const keys = await getKeysFromSeed(mnemonic, crypto);
    const publicKey = u8aToHex(keys.publicKey);
    // Check if the key was already imported
    if (!importedKeys.includes(publicKey)) {
      debug('importAKey', `Importing ${type} ${publicKey} to ${containerName}...`);

      // Constructing command to import key
      const command = ['curl', 'http://localhost:9933', '-H', 'Content-Type:application/json;charset=utf-8', '-d',
                      `{
                        "jsonrpc":"2.0",
                        "id":1,
                        "method":"author_insertKey",
                        "params": [
                          "${type}",
                          "${mnemonic}",
                          "${publicKey}"
                        ]
      }`];
      debug('importAKey', `Executing command: [${command.toString()}]`);

      // Importing key by executing command in docker container
      const result = await dockerExecute(docker, containerName, command);
      debug('importAKey', `Command result: "${result}"`);

      // Checking result
      if (result.includes('"result":null')) {
        importedKeys.push(publicKey);
      } else {
        throw Error(`Can't add key. ${result}`);
      }
    } else {
      debug('importAKey', `Key ${publicKey} was already imported to keystore.`);
    }
  } catch (error) {
    debug('importAKey', error);
    throw error;
  }
};

// Import wallets to polkadot keystore
const polkadotKeysImport = async (docker, containerName) => {
  try {
    console.log('Importing keys to keystore...');

    // Importing 5 validator keys into keystore
    await importAKey(docker, containerName, POLKADOT_KEY_GRAN, 'ed25519', 'gran');
    await importAKey(docker, containerName, POLKADOT_KEY_BABE, 'sr25519', 'babe');
    await importAKey(docker, containerName, POLKADOT_KEY_IMON, 'sr25519', 'imon');
    await importAKey(docker, containerName, POLKADOT_KEY_PARA, 'sr25519', 'para');
    await importAKey(docker, containerName, POLKADOT_KEY_AUDI, 'sr25519', 'audi');

    console.log('Keys were successfully added to keystore...');
  } catch (error) {
    debug('polkadotKeysImport', error);
    console.error('Error: Can\'t add keys. We will retry the next time.');
    console.error(error);
  }
};

// Polkadot start function
const polkadotStart = async (docker, mode) => {
  try {
    // Checking if all necessary variables where set
    checkEnvVars();

    // Launch service in specific mode
    // TODO: Don't sleep before key add
    if (mode === 'active') {
      await startServiceContainer(docker, 'active', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['--name', `${POLKADOT_NAME}-active`, '--validator', '--pruning=archive', '--wasm-execution', 'Compiled'], '/polkadot', POLKADOT_PREFIX + 'polkadot-volume');
      // Waiting to be sure that container is started
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Adding validator keys
      await polkadotKeysImport(docker, POLKADOT_PREFIX + 'polkadot-validator');
    } else if (mode === 'passive') {
      await startServiceContainer(docker, 'passive', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['--name', `${POLKADOT_NAME}-passive`, '--pruning=archive', '--wasm-execution', 'Compiled'], '/polkadot', POLKADOT_PREFIX + 'polkadot-volume');
      // Waiting to be sure that container is started
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Adding validator keys
      await polkadotKeysImport(docker, POLKADOT_PREFIX + 'polkadot-sync');
    } else {
      throw new Error(`Mode '${mode}' is unknown.`);
    }
  } catch (error) {
    debug('polkadotStart', error);
    throw error;
  }
};

// Cleaning up polkadot service
const polkadotCleanUp = async docker => {
  try {
    // Checking if cleaning up process was already started
    if (!cleaningUp) {
      cleaningUp = true;
      console.log('Cleaning containers before exit...');
      await removeContainer(docker, POLKADOT_PREFIX + 'polkadot-sync');
      await removeContainer(docker, POLKADOT_PREFIX + 'polkadot-validator');
    } else {
      console.log('Cleaning up was already started...');
    }
  } catch (error) {
    debug('cleanUp', error);
    console.error(error);
  }
};

module.exports = {
  polkadotStart,
  polkadotCleanUp
};
