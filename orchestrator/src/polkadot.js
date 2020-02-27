const debug = require('debug')('polkadot');
const {
  u8aToHex
} = require('@polkadot/util');
const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs-extra');

const {
  getKeysFromSeed,
  isEmptyString,
  readToObj
} = require('./utils');

const config = {};

class Polkadot {
  static initConfig () {
    try {
      // Check if the config can be retrieved from config file
      if (isEmptyString(process.env.CONFIG_FILE)) {
        // If config can't be retrieved from config file get config from env vars
        // Import env variables from .env file
        dotenv.config();
        config.polkadotName = process.env.POLKADOT_NAME;
        config.polkadotImage = process.env.POLKADOT_IMAGE;
        config.polkadotPrefix = process.env.POLKADOT_PREFIX;
        config.polkadotKeyGran = process.env.POLKADOT_KEY_GRAN;
        config.polkadotKeyBabe = process.env.POLKADOT_KEY_BABE;
        config.polkadotKeyImon = process.env.POLKADOT_KEY_IMON;
        config.polkadotKeyPara = process.env.POLKADOT_KEY_PARA;
        config.polkadotKeyAudi = process.env.POLKADOT_KEY_AUDI;
        config.polkadotReservedNodes = process.env.POLKADOT_RESERVED_NODES;
        config.polkadotTelemetryUrl = process.env.POLKADOT_TELEMETRY_URL;
        config.polkadotLaunchInVpn = process.env.POLKADOT_LAUNCH_IN_VPN;
        config.polkadotNodeKeyFile = process.env.POLKADOT_NODE_KEY_FILE;
      } else {
        if (isEmptyString(process.env.NODE_ID)) {
          throw Error('Polkadot Service need NODE_ID when config file was set.');
        }

        const configFromFile = readToObj('/config/config.json');

        config.polkadotName = `${configFromFile.name}-${NODE_ID}`;
        config.polkadotImage = 'parity/polkadot:latest';
        config.polkadotPrefix = 'node-';
        config.polkadotKeyGran = configFromFile.service.fields.filter(element => element.env === 'POLKADOT_KEY_GRAN').value;
        config.polkadotKeyBabe = configFromFile.service.fields.filter(element => element.env === 'POLKADOT_KEY_BABE').value;
        config.polkadotKeyImon = configFromFile.service.fields.filter(element => element.env === 'POLKADOT_KEY_IMON').value;
        config.polkadotKeyPara = configFromFile.service.fields.filter(element => element.env === 'POLKADOT_KEY_PARA').value;
        config.polkadotKeyAudi = configFromFile.service.fields.filter(element => element.env === 'POLKADOT_KEY_AUDI').value;
        config.polkadotReservedNodes = '';
        config.polkadotTelemetryUrl = '';
        config.polkadotLaunchInVpn = true;
        config.polkadotNodeKeyFile = configFromFile.service.nodeIds[NODE_ID].idFile;

        fs.copyFileSync(`/config/${config.polkadotNodeKeyFile}`, '/keys');
      }
      config.polkadotUnixUserId = 1000;
      config.polkadotUnixGroupId = 1000;
    } catch (error) {
      debug('initConfig', error);
      throw error;
    }
  }

  static checkConfig () {
    // Checking if necessary env vars were set
    try {
      // Checking if all necessary variables where set
      if (isEmptyString(config.polkadotName) || isEmptyString(config.polkadotImage) ||
        isEmptyString(config.polkadotPrefix) || isEmptyString(config.polkadotKeyGran) ||
        isEmptyString(config.polkadotKeyBabe) || isEmptyString(config.polkadotKeyPara) ||
        isEmptyString(config.polkadotKeyImon) || isEmptyString(config.polkadotKeyAudi)) {
        throw Error('Invalid service config.');
      }
      if (fs.existsSync('/service') && isEmptyString(config.polkadotNodeKeyFile)) {
        throw Error('Polkadot Service needs POLKADOT_NODE_KEY_FILE env variables set.');
      }
    } catch (error) {
      debug('checkConfig', error);
      throw error;
    }
  }

  static formatReservedNodes (inputList) {
    const result = [];
    inputList.split(',').map(item => {
      result.push('--reserved-nodes');
      result.push(item);
    });
    return result;
  }

  constructor (docker) {
    // If service is already cleaning up
    this.cleaningUp = false;

    // Already imported keys list
    this.importedKeys = [];

    this.docker = docker;

    // Init config
    Polkadot.initConfig();

    // Check config
    Polkadot.checkConfig();
  }

  // Importing a key in keystore
  async importAKey (containerName, mnemonic, crypto, type) {
    try {
      // Get public key hex from mnemonic
      const keys = await getKeysFromSeed(mnemonic, crypto);
      const publicKey = u8aToHex(keys.publicKey);
      // Check if the key was already imported
      if (!this.importedKeys.includes(publicKey)) {
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

        // Importing key by executing command in docker container
        const result = await this.docker.dockerExecute(containerName, command);
        debug('importAKey', `Command result: "${result}"`);

        // Checking result
        if (result.includes('"result":null')) {
          this.importedKeys.push(publicKey);
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
  }

  // Import wallets to polkadot keystore
  async polkadotKeysImport (containerName) {
    try {
      console.log('Importing keys to keystore...');

      // Importing 5 validator keys into keystore
      await this.importAKey(containerName, POLKADOT_KEY_GRAN, 'ed25519', 'gran');
      await this.importAKey(containerName, POLKADOT_KEY_BABE, 'sr25519', 'babe');
      await this.importAKey(containerName, POLKADOT_KEY_IMON, 'sr25519', 'imon');
      await this.importAKey(containerName, POLKADOT_KEY_PARA, 'sr25519', 'para');
      await this.importAKey(containerName, POLKADOT_KEY_AUDI, 'sr25519', 'audi');

      console.log('Keys were successfully added to keystore...');
    } catch (error) {
      debug('polkadotKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      console.error(error);
    }
  }

  // Copy keys files to volume
  async copyFilesToPolkadotContainer () {
    try {
      // Set polkadot user rights
      await fs.chown('/service', POLKADOT_UNIX_USER_ID, POLKADOT_UNIX_GROUP_ID);
      await fs.ensureDir('/service/keys');
      await fs.copy('/keys/' + POLKADOT_NODE_KEY_FILE, '/service/keys/' + POLKADOT_NODE_KEY_FILE);
      console.log('copy ' + POLKADOT_NODE_KEY_FILE + ' file in polkadot container folder /polkadot/keys/');
    } catch (err) {
      console.error(err);
    }
  }

  // Polkadot start function
  async start (mode) {
    try {
      const commonPolkadotOptions = ['--pruning=archive', '--wasm-execution', 'Compiled'];
      if (fs.existsSync('/service')) {
        await this.copyFilesToPolkadotContainer();
        commonPolkadotOptions.push('--node-key-file=/polkadot/keys/' + POLKADOT_NODE_KEY_FILE);
      }
      if (!isEmptyString(POLKADOT_RESERVED_NODES)) {
        commonPolkadotOptions.push(...Polkadot.formatReservedNodes(POLKADOT_RESERVED_NODES));
      }
      if (!isEmptyString(POLKADOT_TELEMETRY_URL)) {
        if (POLKADOT_TELEMETRY_URL === '--no-telemetry') {
          commonPolkadotOptions.push(...['--no-telemetry']);
        } else {
          commonPolkadotOptions.push(...['--telemetry-url', POLKADOT_TELEMETRY_URL]);
        }
      }
      // Setting network mode variable if polkadot must be launched in VPN network
      let networkMode = '';
      if (POLKADOT_LAUNCH_IN_VPN !== undefined && POLKADOT_LAUNCH_IN_VPN === 'true') {
        networkMode = `container:${os.hostname()}`;
        console.log(`Launching container with network mode: ${networkMode}...`);
      }

      // Get service volume from orchestrator and give this volume to polkadot container
      const orchestratorServiceVolume = await this.docker.getMountThatContains(os.hostname(), 'service');
      let polkadotVolume;
      if (orchestratorServiceVolume) {
        polkadotVolume = orchestratorServiceVolume.Name;
      } else {
        polkadotVolume = POLKADOT_PREFIX + 'polkadot-volume';
      }
      console.log(`Polkadot will use volume '${polkadotVolume}'...`);

      // Launch service in specific mode
      // TODO: Don't sleep before key add
      if (mode === 'active') {
        await this.docker.startServiceContainer('active', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['--name', `${POLKADOT_NAME}-active`, ...commonPolkadotOptions, '--validator', '--reserved-only'], '/polkadot', polkadotVolume, networkMode);
        // Waiting to be sure that container is started
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Adding validator keys
        await this.polkadotKeysImport(POLKADOT_PREFIX + 'polkadot-validator');
      } else if (mode === 'passive') {
        await this.docker.startServiceContainer('passive', POLKADOT_PREFIX + 'polkadot-validator', POLKADOT_PREFIX + 'polkadot-sync', POLKADOT_IMAGE, ['--name', `${POLKADOT_NAME}-passive`, ...commonPolkadotOptions, '--sentry'], '/polkadot', polkadotVolume, networkMode);
        // Waiting to be sure that container is started
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Adding validator keys
        await this.polkadotKeysImport(POLKADOT_PREFIX + 'polkadot-sync');
      } else {
        throw new Error(`Mode '${mode}' is unknown.`);
      }
    } catch (error) {
      debug('polkadotStart', error);
      throw error;
    }
  }

  // Cleaning up polkadot service
  async cleanUp () {
    try {
      // Checking if cleaning up process was already started
      if (!this.cleaningUp) {
        this.cleaningUp = true;
        console.log('Cleaning containers before exit...');
        await this.docker.removeContainer(POLKADOT_PREFIX + 'polkadot-sync');
        await this.docker.removeContainer(POLKADOT_PREFIX + 'polkadot-validator');
      } else {
        console.log('Cleaning up was already started...');
      }
    } catch (error) {
      debug('cleanUp', error);
      console.error(error);
    }
  }
}

module.exports = {
  Polkadot
};
