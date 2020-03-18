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
  readToObj,
  checkVariable,
  formatReservedNodesList
} = require('./utils');

const config = {};

class Polkadot {
  // Init configuration
  static initConfig () {
    try {
      // Get config from env variables
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
      config.polkadotUnixUserId = 1000;
      config.polkadotUnixGroupId = 1000;
      config.polkadotRpcPort = '9993';

      // Simulate Polkadot node synchronized state. For test purposes only
      config.polkadotSimulateSynch = false;
      if (!isEmptyString(process.env.POLKADOT_SIMULATE_SYNCH) && process.env.POLKADOT_SIMULATE_SYNCH.includes('true')) {
        config.polkadotSimulateSynch = true;
      }

      // Check if the config can be retrieved from config file
      if (isEmptyString(process.env.CONFIG_FILE)) {
        return;
      }

      if (isEmptyString(process.env.NODE_ID)) {
        throw Error('Polkadot Service need NODE_ID when config file was set.');
      }

      const configFromFile = readToObj('/config/config.json');

      // Checking if value was not already set by env vars
      if (isEmptyString(config.polkadotName)) {
        if ('name' in configFromFile) {
          config.polkadotName = `${configFromFile.name}-${process.env.NODE_ID}`;
        }
      }

      if (isEmptyString(config.polkadotImage)) {
        config.polkadotImage = 'parity/polkadot:latest';
      }

      if (isEmptyString(config.polkadotPrefix)) {
        config.polkadotPrefix = 'node-';
      }

      if (isEmptyString(config.polkadotKeyGran)) {
        const polkadotKeyGran = configFromFile.service.fields.find(element => element.env === 'POLKADOT_KEY_GRAN');
        if (polkadotKeyGran !== undefined) {
          config.polkadotKeyGran = polkadotKeyGran.value;
        }
      }

      if (isEmptyString(config.polkadotKeyBabe)) {
        const polkadotKeyBabe = configFromFile.service.fields.find(element => element.env === 'POLKADOT_KEY_BABE');
        if (polkadotKeyBabe !== undefined) {
          config.polkadotKeyBabe = polkadotKeyBabe.value;
        }
      }

      if (isEmptyString(config.polkadotKeyImon)) {
        const polkadotKeyImon = configFromFile.service.fields.find(element => element.env === 'POLKADOT_KEY_IMON');
        if (polkadotKeyImon !== undefined) {
          config.polkadotKeyImon = polkadotKeyImon.value;
        }
      }

      if (isEmptyString(config.polkadotKeyPara)) {
        const polkadotKeyPara = configFromFile.service.fields.find(element => element.env === 'POLKADOT_KEY_PARA');
        if (polkadotKeyPara !== undefined) {
          config.polkadotKeyPara = polkadotKeyPara.value;
        }
      }

      if (isEmptyString(config.polkadotKeyAudi)) {
        const polkadotKeyAudi = configFromFile.service.fields.find(element => element.env === 'POLKADOT_KEY_AUDI');
        if (polkadotKeyAudi !== undefined) {
          config.polkadotKeyAudi = polkadotKeyAudi.value;
        }
      }

      if (isEmptyString(config.polkadotReservedNodes)) {
        if ('service' in configFromFile && 'reservedPeersList' in configFromFile.service) {
          config.polkadotReservedNodes = configFromFile.service.reservedPeersList;
        }
      }

      if (isEmptyString(config.polkadotLaunchInVpn)) {
        config.polkadotLaunchInVpn = 'true';
      }

      if (isEmptyString(config.polkadotNodeKeyFile)) {
        if ('nodeIds' in configFromFile.service && configFromFile.service.nodeIds[parseInt(process.env.NODE_ID) - 1].idFile !== undefined) {
          config.polkadotNodeKeyFile = configFromFile.service.nodeIds[parseInt(process.env.NODE_ID) - 1].idFile;
        }
      }
    } catch (error) {
      debug('initConfig', error);
      throw error;
    }
  }

  // Check if configuration was successfully set
  static checkConfig () {
    // Checking if necessary env vars were set
    try {
      // Checking if all necessary variables where set
      checkVariable(config.polkadotName, 'Polkadot Name');
      checkVariable(config.polkadotImage, 'Polkadot Image');
      checkVariable(config.polkadotPrefix, 'Polkadot Prefix');
      checkVariable(config.polkadotKeyGran, 'Polkadot Key Gran');
      checkVariable(config.polkadotKeyBabe, 'Polkadot Key Babe');
      checkVariable(config.polkadotKeyPara, 'Polkadot Key Para');
      checkVariable(config.polkadotKeyImon, 'Polkadot Key Imon');
      checkVariable(config.polkadotKeyAudi, 'Polkadot Key Audi');

      // Check if polkadot node key file exists
      if (fs.existsSync('/service') && isEmptyString(config.polkadotNodeKeyFile)) {
        throw Error('Polkadot Service needs polkadotNodeKeyFile variable set.');
      }
    } catch (error) {
      debug('checkConfig', error);
      throw error;
    }
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
      if (this.importedKeys.includes(publicKey)) {
        console.log(`Key ${publicKey} was already imported to keystore...`);
        return;
      }

      debug('importAKey', `Importing ${type} ${publicKey} to ${containerName}...`);

      // Constructing command to import key
      const command = ['curl', 'http://localhost:' + config.polkadotRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
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
      if (!result.includes('"result":null')) {
        console.log(`Can't add key. ${type} - ${result}. Will retry the next time...`);
        return;
      }

      // Check if key is present in containers file system
      const keyAdded = await this.checkKeyAdded(mnemonic, crypto, containerName);
      if (!keyAdded) {
        console.log(`Key (${type} - ${result}) can not be found in container. Will retry to add the next time...`);
        return;
      }

      // Add key into imported key list
      this.importedKeys.push(publicKey);
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
      await this.importAKey(containerName, config.polkadotKeyGran, 'ed25519', 'gran');
      await this.importAKey(containerName, config.polkadotKeyBabe, 'sr25519', 'babe');
      await this.importAKey(containerName, config.polkadotKeyImon, 'sr25519', 'imon');
      await this.importAKey(containerName, config.polkadotKeyPara, 'sr25519', 'para');
      await this.importAKey(containerName, config.polkadotKeyAudi, 'sr25519', 'audi');
    } catch (error) {
      debug('polkadotKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      console.error(error);
    }
  }

  // Check if a key file is present in container file system
  async checkKeyAdded (mnemonic, crypto, containerName) {
    try {
      const keys = await getKeysFromSeed(mnemonic, crypto);
      const publicKey = u8aToHex(keys.publicKey);

      const command = [
        'find',
        '/polkadot',
        '-name',
        `*${publicKey.substring(2)}`
      ];

      // Call find key command in docker container
      const result = await this.docker.dockerExecute(containerName, command);
      debug('checkKeyAdded', `Command find key result: "${result}"`);

      return !!result;
    } catch (error) {
      debug('checkKeyAdded', error);
      throw error;
    }
  }

  // Check if polkadot is synch and ready to operate (Synch etc ...)
  // Curl result example :  "W{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":1,"shouldHavePeers":true},"id":1}"
  // TODO ? call also system_networkState
  // - add metrics "averageDownloadPerSec"
  // - add metrics "averageUploadPerSec"
  async isServiceReadyToStart (mode) {
    try {
      // By default we will check sync container
      let containerName = config.polkadotPrefix + 'polkadot-sync';

      // If mode is active we will check validator container
      if (mode === 'active') {
        containerName = config.polkadotPrefix + 'polkadot-validator';
      }

      // Check if container exists and is running
      const containerExistAndRunning = await this.docker.isContainerRunningByName(containerName);
      if (!containerExistAndRunning) {
        debug('isServiceReadyToStart', `Service is not ready to start. Container : "${containerName}" is not running. `);
        return false;
      }
      debug('isServiceReadyToStart', `container : "${containerName}" exist and in running state.`);

      // Check if a simulate synch option was set
      if (config.polkadotSimulateSynch) {
        debug('isServiceReadyToStart', 'Test mode simulate synch node.');
        return true;
      }

      // Construct command to check system_health
      const commandSystemHealth = ['curl', 'http://localhost:' + config.polkadotRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
                       `{
                        "jsonrpc":"2.0",
                        "id":1,
                        "method":"system_health"
      }`];

      // Call system_health command in docker container
      const resultSystemHealth = await this.docker.dockerExecute(containerName, commandSystemHealth);
      debug('isServiceReadyToStart', `Command system_health result: "${resultSystemHealth}"`);

      // Checking if system_health gives a result
      if (!resultSystemHealth.includes('"result":')) {
        debug('isServiceReadyToStart', 'system_health call has no result. Service is not ready.');
        return false;
      }

      // Get peers info
      const peersSystemHealth = resultSystemHealth.match(/"peers":\d+/);
      debug('isServiceReadyToStart', 'peersSystemHealth:' + peersSystemHealth);

      // Check if peers info is ready
      if (!peersSystemHealth || peersSystemHealth.length !== 1) {
        debug('isServiceReadyToStart', 'system_health call has no peers result. Service is not ready.');
        return false;
      }

      // Check peers number
      const peersNumber = parseInt(peersSystemHealth[0].split(':')[1]);
      if (peersNumber <= 0) {
        debug('isServiceReadyToStart', 'system_health peers == 0. Service us not ready.');
        return false;
      }
      debug('isServiceReadyToStart', `system_health peers > 0 :"${peersNumber}" peers. Check synch status.`);

      // Check if node is in synch state
      const isSyncingSystemHealth = resultSystemHealth.match(/"isSyncing":true|false/);
      debug('isServiceReadyToStart', 'isSyncingSystemHealth:' + isSyncingSystemHealth);
      if (isSyncingSystemHealth.includes('false')) {
        debug('isServiceReadyToStart', 'Node is synchronized. Node is ready to validate...');
        return true;
      } else {
        debug('isServiceReadyToStart', 'Node is currently syncing. Service is not ready.');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // Copy keys files to volume
  async copyFilesToServiceDirectory () {
    try {
      // Check if node key file is already present
      if (fs.existsSync(`/service/keys/${config.polkadotNodeKeyFile}`)) {
        console.log(`File ${config.polkadotNodeKeyFile} is already in /service/key directory...`);
        return;
      }

      // Create keys directory
      await fs.ensureDir('/service/keys');

      // Copy polkadot node key file
      console.log(`Copying ${config.polkadotNodeKeyFile} from /config/ to /service/keys/...`);
      await fs.copy(`/config/${config.polkadotNodeKeyFile}`, `/service/keys/${config.polkadotNodeKeyFile}`);

      // Fix permissions
      await fs.chown('/service', config.polkadotUnixUserId, config.polkadotUnixGroupId);
      await fs.chown('/service/keys', config.polkadotUnixUserId, config.polkadotUnixGroupId);
      await fs.chown(`/service/keys/${config.polkadotNodeKeyFile}`, config.polkadotUnixUserId, config.polkadotUnixGroupId);
    } catch (error) {
      debug('copyFilesToServiceDirectory', error);
      throw error;
    }
  }

  // Check launched container
  async checkLaunchedContainer () {
    if (await this.docker.isContainerRunningByName(config.polkadotPrefix + 'polkadot-validator')) {
      return 'active';
    }
    if (await this.docker.isContainerRunningByName(config.polkadotPrefix + 'polkadot-sync')) {
      return 'passive';
    }
    return 'none';
  }

  // Polkadot start function
  async start (mode) {
    try {
      const commonPolkadotOptions = [
        '--pruning=archive',
        '--wasm-execution',
        'Compiled',
        '--rpc-cors',
        'http://localhost',
        '--rpc-port',
        config.polkadotRpcPort
      ];

      // If polkadotNodeKeyFile variable is set
      // And service directory exists use node key file
      if (!isEmptyString(config.polkadotNodeKeyFile) && fs.existsSync('/service')) {
        await this.copyFilesToServiceDirectory();
        commonPolkadotOptions.push('--node-key-file=/polkadot/keys/' + config.polkadotNodeKeyFile);
      }

      // Adding reserved nodes
      if (!isEmptyString(config.polkadotReservedNodes)) {
        commonPolkadotOptions.push(...formatReservedNodesList(config.polkadotReservedNodes));
      }

      // Adding telemetry Url
      if (!isEmptyString(config.polkadotTelemetryUrl)) {
        if (config.polkadotTelemetryUrl === '--no-telemetry') {
          commonPolkadotOptions.push('--no-telemetry');
        } else {
          commonPolkadotOptions.push(...['--telemetry-url', config.polkadotTelemetryUrl]);
        }
      }

      // Setting network mode variable if polkadot must be launched in VPN network
      let networkMode = '';
      if (config.polkadotLaunchInVpn !== undefined && config.polkadotLaunchInVpn === 'true') {
        networkMode = `container:${os.hostname()}`;
        console.log(`Container network mode: ${networkMode}...`);
      }

      // Get service volume from orchestrator and give this volume to polkadot container
      const orchestratorServiceVolume = await this.docker.getMountThatContains(os.hostname(), 'service');
      let polkadotVolume;
      if (orchestratorServiceVolume) {
        polkadotVolume = orchestratorServiceVolume.Name;
      } else {
        polkadotVolume = config.polkadotPrefix + 'polkadot-volume';
      }
      console.log(`Polkadot will use volume '${polkadotVolume}'...`);

      // Launch service in specific mode
      let containerName = '';
      if (mode === 'active') {
        await this.docker.startServiceContainer(
          'active',
          config.polkadotPrefix + 'polkadot-validator',
          config.polkadotPrefix + 'polkadot-sync',
          config.polkadotImage,
          ['--name', `${config.polkadotName}-active`, ...commonPolkadotOptions, '--validator', '--reserved-only']
          , '/polkadot',
          polkadotVolume,
          networkMode
        );
        containerName = config.polkadotPrefix + 'polkadot-validator';
      } else if (mode === 'passive') {
        await this.docker.startServiceContainer(
          'passive',
          config.polkadotPrefix + 'polkadot-validator',
          config.polkadotPrefix + 'polkadot-sync',
          config.polkadotImage,
          ['--name', `${config.polkadotName}-passive`, ...commonPolkadotOptions, '--sentry'],
          '/polkadot',
          polkadotVolume,
          networkMode
        );
        containerName = config.polkadotPrefix + 'polkadot-sync';
      } else {
        throw new Error(`Mode '${mode}' is unknown.`);
      }

      // Adding keys to polkadot keystore if there is no already 5 keys
      if (this.importedKeys.length < 5) {
        // Waiting for 10 seconds to be sure that node was started
        await new Promise(resolve => setTimeout(resolve, 10000));
        await this.polkadotKeysImport(containerName);
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
        await this.docker.removeContainer(config.polkadotPrefix + 'polkadot-sync');
        await this.docker.removeContainer(config.polkadotPrefix + 'polkadot-validator');
      } else {
        console.log('Cleaning up was already started...');
      }
      this.cleaningUp = false;
    } catch (error) {
      debug('cleanUp', error);
      console.error(error);
    }
  }
}

module.exports = {
  Polkadot
};
