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
  checkVariable
} = require('./utils');

const config = {};

class Polkadot {
  // Init configuration
  static initConfig () {
    try {
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

      // For test purpose add a simulate synch to note wait full Kusama to synch
      config.polkadotSimulateSynch = false;
      if (!isEmptyString(process.env.POLKADOT_SIMULATE_SYNCH) && process.env.POLKADOT_SIMULATE_SYNCH.includes('true')) {
        config.polkadotSimulateSynch = true;
      }

      // If the config can be retrieved from config file
      if (!isEmptyString(process.env.CONFIG_FILE)) {
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
      }
      config.polkadotUnixUserId = 1000;
      config.polkadotUnixGroupId = 1000;
      config.polkadotRpcPort = '9993';
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
        if (result.includes('"result":null')) {
          this.importedKeys.push(publicKey);
        } else {
          throw Error(`Can't add key. ${type} - ${result}`);
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
      await this.importAKey(containerName, config.polkadotKeyGran, 'ed25519', 'gran');
      await this.importAKey(containerName, config.polkadotKeyBabe, 'sr25519', 'babe');
      await this.importAKey(containerName, config.polkadotKeyImon, 'sr25519', 'imon');
      await this.importAKey(containerName, config.polkadotKeyPara, 'sr25519', 'para');
      await this.importAKey(containerName, config.polkadotKeyAudi, 'sr25519', 'audi');

      console.log('Keys were successfully added to keystore...');
    } catch (error) {
      debug('polkadotKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      console.error(error);
    }
  }

  // Check if polkadot is synch and ready to operate (Synch etc ...)
  // Curl result exemple :  "W{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":1,"shouldHavePeers":true},"id":1}"
  // TODO ? call also system_networkState
  // - add metrics "averageDownloadPerSec"
  // - add metrics "averageUploadPerSec"
  async isServiceReadyToStart () {
    try {
      console.log('isServiceReadyToStart function start');
      const containerName = config.polkadotPrefix + 'polkadot-sync';
      // check container exist and running
      const containerExistAndRunning = await this.docker.isContainerRunningByName(containerName);
      if (!containerExistAndRunning) {
        debug('isServiceReadyToStart', `Service NOT ready to start, container : "${containerName}" is not running. `);
        return false;
      }
      debug('isServiceReadyToStart', `container : "${containerName}" exist and in running state.`);
      // call and check polkadot system_health
      const commandSystemHealth = ['curl', 'http://localhost:' + config.polkadotRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
                       `{
                        "jsonrpc":"2.0",
                        "id":1,
                        "method":"system_health"
      }`];

      // Call system_health command in docker container
      const resultSystemHealth = await this.docker.dockerExecute(containerName, commandSystemHealth);
      debug('isServiceReadyToStart', `Command system_health result: "${resultSystemHealth}"`);

      // Checking system_health result
      if (resultSystemHealth.includes('"result":')) {
        // Checking Peers number > 0
        const peersSystemHealth = resultSystemHealth.match(/"peers":\d+/);
        debug('isServiceReadyToStart', 'peersSystemHealth:' + peersSystemHealth);
        if (peersSystemHealth && peersSystemHealth.length === 1) {
          const peersNumber = parseInt(peersSystemHealth[0].split(':')[1]);
          if (peersNumber > 0) {
            debug('isServiceReadyToStart', `system_health peers > 0 :"${peersNumber}" peers. Check synch status.`);
            if (config.polkadotSimulateSynch) {
              debug('isServiceReadyToStart', 'Test mode simulate synch node.');
              return true;
            }
            // Checking isSyncing
            const isSyncingSystemHealth = resultSystemHealth.match(/"isSyncing":true|false/);
            debug('isServiceReadyToStart', 'isSyncingSystemHealth:' + isSyncingSystemHealth);
            if (isSyncingSystemHealth.includes('false')) {
              debug('isServiceReadyToStart', 'system_health call node is SYNCH. Service is READY to validate');
              return true;
            } else {
              debug('isServiceReadyToStart', 'system_health call node is currently syncing. Service not ready.');
              return false;
            }
          } else {
            debug('isServiceReadyToStart', 'system_health peers == 0. Service not ready.');
            return false;
          }
        } else {
          debug('isServiceReadyToStart', 'system_health call has no peers result. Service not ready.');
          return false;
        }
      } else {
        debug('isServiceReadyToStart', 'system_health call has no result. Service not ready.');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // Copy keys files to volume
  async copyFilesToPolkadotContainer () {
    try {
      // Set polkadot user rights
      await fs.chown('/service', config.polkadotUnixUserId, config.polkadotUnixGroupId);
      await fs.ensureDir('/service/keys');
      await fs.copy('/config/' + config.polkadotNodeKeyFile, '/service/keys/' + config.polkadotNodeKeyFile);
      console.log('copy ' + config.polkadotNodeKeyFile + ' file in polkadot container folder /polkadot/keys/');
    } catch (err) {
      console.error(err);
    }
  }

  // Polkadot start function
  async start (mode) {
    try {
      const commonPolkadotOptions = ['--pruning=archive', '--wasm-execution', 'Compiled'];
      commonPolkadotOptions.push(...['--rpc-cors', 'http://localhost']);
      commonPolkadotOptions.push(...['--rpc-port', config.polkadotRpcPort]);
      if (fs.existsSync('/service')) {
        await this.copyFilesToPolkadotContainer();
        commonPolkadotOptions.push('--node-key-file=/polkadot/keys/' + config.polkadotNodeKeyFile);
      }
      if (!isEmptyString(config.polkadotReservedNodes)) {
        commonPolkadotOptions.push(...Polkadot.formatReservedNodes(config.polkadotReservedNodes));
      }
      if (!isEmptyString(config.polkadotTelemetryUrl)) {
        if (config.polkadotTelemetryUrl === '--no-telemetry') {
          commonPolkadotOptions.push(...['--no-telemetry']);
        } else {
          commonPolkadotOptions.push(...['--telemetry-url', config.polkadotTelemetryUrl]);
        }
      }
      // Setting network mode variable if polkadot must be launched in VPN network
      let networkMode = '';
      if (config.polkadotLaunchInVpn !== undefined && config.polkadotLaunchInVpn === 'true') {
        networkMode = `container:${os.hostname()}`;
        console.log(`Launching container with network mode: ${networkMode}...`);
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
      // TODO: Don't sleep before key add
      if (mode === 'active') {
        await this.docker.startServiceContainer('active', config.polkadotPrefix + 'polkadot-validator', config.polkadotPrefix + 'polkadot-sync', config.polkadotImage, ['--name', `${config.polkadotName}-active`, ...commonPolkadotOptions, '--validator', '--reserved-only'], '/polkadot', polkadotVolume, networkMode);
        // Waiting to be sure that container is started
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Adding validator keys
        await this.polkadotKeysImport(config.polkadotPrefix + 'polkadot-validator');
      } else if (mode === 'passive') {
        await this.docker.startServiceContainer('passive', config.polkadotPrefix + 'polkadot-validator', config.polkadotPrefix + 'polkadot-sync', config.polkadotImage, ['--name', `${config.polkadotName}-passive`, ...commonPolkadotOptions, '--sentry'], '/polkadot', polkadotVolume, networkMode);
        // Waiting to be sure that container is started
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Adding validator keys
        await this.polkadotKeysImport(config.polkadotPrefix + 'polkadot-sync');
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
        await this.docker.removeContainer(config.polkadotPrefix + 'polkadot-sync');
        await this.docker.removeContainer(config.polkadotPrefix + 'polkadot-validator');
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
