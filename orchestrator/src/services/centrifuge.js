const debug = require('debug')('centrifuge');
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
  formatOptionList,
  formatOptionCmds
} = require('../utils');
const { Docker } = require('../docker');

const config = {};

class Centrifuge {
  // Init configuration
  static initConfig () {
    try {
      // Get config from env variables
      dotenv.config();
      config.centrifugeImage = process.env.CENTRIFUGE_IMAGE;
      config.centrifugeValidatorName = process.env.CENTRIFUGE_VALIDATOR_NAME;
      config.centrifugeKeyGran = process.env.CENTRIFUGE_KEY_GRAN;
      config.centrifugeKeyBabe = process.env.CENTRIFUGE_KEY_BABE;
      config.centrifugeKeyImon = process.env.CENTRIFUGE_KEY_IMON;
      config.centrifugeKeyAudi = process.env.CENTRIFUGE_KEY_AUDI;
      config.centrifugeReservedNodes = process.env.CENTRIFUGE_RESERVED_NODES;
      config.centrifugeTelemetryUrl = process.env.CENTRIFUGE_TELEMETRY_URL;
      config.centrifugeNodeKeyFile = process.env.CENTRIFUGE_NODE_KEY_FILE;
      config.centrifugeAdditionalOptions = process.env.CENTRIFUGE_ADDITIONAL_OPTIONS;
      config.nodesRole = process.env.NODES_ROLE;
      config.nodeId = process.env.NODE_ID;
      config.centrifugeSessionKeyToCheck = process.env.CENTRIFUGE_SESSION_KEY_TO_CHECK;
      config.centrifugeUnixUserId = 1000;
      config.centrifugeUnixGroupId = 1000;
      config.centrifugeRpcPort = '9993';

      // Simulate centrifuge node synchronized state. For test purposes only
      config.centrifugeSimulateSynch = false;
      if (!isEmptyString(process.env.CENTRIFUGE_SIMULATE_SYNCH) && process.env.CENTRIFUGE_SIMULATE_SYNCH.includes('true')) {
        config.centrifugeSimulateSynch = true;
      }

      // Check if the config can be retrieved from config file
      if (isEmptyString(process.env.CONFIG_FILE)) {
        return;
      }

      if (isEmptyString(config.nodeId)) {
        throw Error('centrifuge Service need NODE_ID when config file was set.');
      }

      const configFromFile = readToObj('/config/config.json');

      // Checking if value was not already set by env vars
      if ('name' in configFromFile) {
        config.centrifugeName = `${configFromFile.name}-node-${config.nodeId}`;
      }

      if (isEmptyString(config.centrifugeImage)) {
        config.centrifugeImage = 'centrifugeio/centrifuge-chain:latest';
      }

      if (isEmptyString(config.centrifugeKeyGran)) {
        const centrifugeKeyGran = configFromFile.services.find(element => element.name === 'centrifuge').fields[parseInt(config.nodeId) - 1].find(element => element.env === 'CENTRIFUGE_KEY_GRAN');
        if (centrifugeKeyGran !== undefined) {
          config.centrifugeKeyGran = centrifugeKeyGran.value;
        }
      }

      if (isEmptyString(config.centrifugeKeyBabe)) {
        const centrifugeKeyBabe = configFromFile.services.find(element => element.name === 'centrifuge').fields[parseInt(config.nodeId) - 1].find(element => element.env === 'CENTRIFUGE_KEY_BABE');
        if (centrifugeKeyBabe !== undefined) {
          config.centrifugeKeyBabe = centrifugeKeyBabe.value;
        }
      }

      if (isEmptyString(config.centrifugeKeyImon)) {
        const centrifugeKeyImon = configFromFile.services.find(element => element.name === 'centrifuge').fields[parseInt(config.nodeId) - 1].find(element => element.env === 'CENTRIFUGE_KEY_IMON');
        if (centrifugeKeyImon !== undefined) {
          config.centrifugeKeyImon = centrifugeKeyImon.value;
        }
      }

      if (isEmptyString(config.centrifugeKeyAudi)) {
        const centrifugeKeyAudi = configFromFile.services.find(element => element.name === 'centrifuge').fields[parseInt(config.nodeId) - 1].find(element => element.env === 'CENTRIFUGE_KEY_AUDI');
        if (centrifugeKeyAudi !== undefined) {
          config.centrifugeKeyAudi = centrifugeKeyAudi.value;
        }
      }

      if (isEmptyString(config.centrifugeReservedNodes)) {
        if ('services' in configFromFile && 'reservedPeersList' in configFromFile.services.find(element => element.name === 'centrifuge')) {
          config.centrifugeReservedNodes = configFromFile.services.find(element => element.name === 'centrifuge').reservedPeersList;
        }
      }

      if (isEmptyString(config.nodesRole)) {
        if ('nodesRole' in configFromFile) {
          config.nodesRole = configFromFile.nodesRole;
        }
      }

      if (isEmptyString(config.centrifugeNodeKeyFile)) {
        const centrifugeSrvConfig = configFromFile.services.find(element => element.name === 'centrifuge');
        if ('nodeIds' in centrifugeSrvConfig && centrifugeSrvConfig.nodeIds[parseInt(config.nodeId) - 1].idFile !== undefined) {
          config.centrifugeNodeKeyFile = centrifugeSrvConfig.nodeIds[parseInt(config.nodeId) - 1].idFile;
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
      checkVariable(config.centrifugeName, 'Centrifuge Name');
      checkVariable(config.centrifugeImage, 'Centrifuge Image');
      checkVariable(config.centrifugeKeyGran, 'Centrifuge Key Gran');
      checkVariable(config.centrifugeKeyBabe, 'Centrifuge Key Babe');
      checkVariable(config.centrifugeKeyImon, 'Centrifuge Key Imon');
      checkVariable(config.centrifugeKeyAudi, 'Centrifuge Key Audi');
    } catch (error) {
      debug('checkConfig', error);
      throw error;
    }
  }

  constructor () {
    // If service is already cleaning up
    this.cleaningUp = false;

    // Already imported keys list
    this.importedKeys = [];

    this.docker = new Docker();

    // Init config
    Centrifuge.initConfig();

    // Check config
    Centrifuge.checkConfig();

    // Centrifuge volume init
    this.centrifugeVolume = '';

    // Common CentrifugeOptions
    this.commonCentrifugeOptions = [];

    // Network mode init
    this.networkMode = '';

    // Service prepared
    this.prepared = false;
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
      const command = ['/centrifuge/centrifuge/bin/curl', 'http://localhost:' + config.centrifugeRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
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
      debug('importAKey centrifuge', error);
      throw error;
    }
  }

  // Import wallets to centrifuge keystore
  async centrifugeKeysImport (containerName) {
    try {
      console.log('Importing centrifuge keys to keystore...');
      // Importing 4 validator keys into keystore
      await this.importAKey(containerName, config.centrifugeKeyGran, 'ed25519', 'gran');
      await this.importAKey(containerName, config.centrifugeKeyBabe, 'sr25519', 'babe');
      await this.importAKey(containerName, config.centrifugeKeyImon, 'sr25519', 'imon');
      await this.importAKey(containerName, config.centrifugeKeyAudi, 'sr25519', 'audi');
    } catch (error) {
      debug('centrifugeKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      console.error(error);
    }
  }

  async checkSessionKeyOnNode (containerName, sessionKey) {
    try {
      console.log('check centrifuge Session Key valid On Node for session key value :');
      console.log(sessionKey);
      // Constructing command check session key
      const command = ['/centrifuge/centrifuge/bin/curl', 'http://localhost:' + config.centrifugeRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
    `{
      "jsonrpc":"2.0",
      "id":1,
      "method":"author_hasSessionKeys",
      "params": [
        "${sessionKey}"
      ]
    }`];

      // Importing key by executing command in docker container
      const result = await this.docker.dockerExecute(containerName, command);
      console.log(`Command hasSessionKeys result: "${result}"`);
    } catch (error) {
      debug('checkSessionKeyOnNode', error);
      console.error('Error: Can\'t check session key');
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
        '/centrifuge',
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

  // Check if centrifuge is synch and ready to operate (Synch etc ...)
  // Curl result example :  "W{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":1,"shouldHavePeers":true},"id":1}"

  async isServiceReadyToStart (mode) {
    try {
      // By default we will check sync container
      let containerName = 'centrifuge-sync';

      // If mode is active we will check validator container
      if (mode === 'active') {
        containerName = 'centrifuge-validator';
      }

      // Check if container exists and is running
      const containerExistAndRunning = await this.docker.isContainerRunning(containerName);
      if (!containerExistAndRunning) {
        debug('isServiceReadyToStart', `Service is not ready to start. Container : "${containerName}" is not running. `);
        return false;
      }
      debug('isServiceReadyToStart', `container : "${containerName}" exist and in running state.`);

      // Check if a simulate synch option was set
      if (config.centrifugeSimulateSynch) {
        debug('isServiceReadyToStart', 'Test mode simulate synch node.');
        return true;
      }

      // Construct command to check system_health
      const commandSystemHealth = ['curl', 'http://localhost:' + config.centrifugeRpcPort, '-H', 'Content-Type:application/json;charset=utf-8', '-d',
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
      // Create keys directory
      await fs.ensureDir('/service/centrifuge');
      await fs.ensureDir('/service/centrifuge/keys');
      await fs.ensureDir('/service/centrifuge/bin');
      await fs.ensureDir('/service/centrifuge/chain');

      // Copy centrifuge node key file
      console.log(`Copying ${config.centrifugeNodeKeyFile} from /config/ to /service/centrifuge/keys/...`);
      await fs.copy(`/config/${config.centrifugeNodeKeyFile}`, `/service/centrifuge/keys/${config.centrifugeNodeKeyFile}`);

      // Fix permissions
      await fs.chown('/service/centrifuge', config.centrifugeUnixUserId, config.centrifugeUnixGroupId);
      await fs.chown('/service/centrifuge/keys', config.centrifugeUnixUserId, config.centrifugeUnixGroupId);
      await fs.chown('/service/centrifuge/chain', config.centrifugeUnixUserId, config.centrifugeUnixGroupId);
      await fs.chown(`/service/centrifuge/keys/${config.centrifugeNodeKeyFile}`, config.centrifugeUnixUserId, config.centrifugeUnixGroupId);
      // add static curl bin into centrifuge container
      await fs.copy('/usr/local/bin/curl-static', '/service/centrifuge/bin/curl');
    } catch (error) {
      debug('copyFilesToServiceDirectory', error);
      throw error;
    }
  }

  // Check launched container
  async checkLaunchedContainer () {
    if (await this.docker.isContainerRunning('centrifuge-validator')) {
      return 'active';
    }
    if (await this.docker.isContainerRunning('centrifuge-sync')) {
      return 'passive';
    }
    return 'none';
  }

  // Prepare service before launch
  async prepareService () {
    // Common centrifuge options
    this.commonCentrifugeOptions = [
      '--base-path',
      '/centrifuge/centrifuge/chain',
      '--pruning=archive',
      '--rpc-cors',
      'http://localhost',
      '--rpc-port',
      config.centrifugeRpcPort
    ];

    // Adding additional centrifuge Option Commands
    if (!isEmptyString(config.centrifugeAdditionalOptions)) {
      this.commonCentrifugeOptions.push(...formatOptionCmds(config.centrifugeAdditionalOptions));
    }

    // If centrifugeNodeKeyFile variable is set
    // And service directory exists use node key file
    if (!isEmptyString(config.centrifugeNodeKeyFile) && fs.existsSync('/service')) {
      await this.copyFilesToServiceDirectory();
      // TODO :  hex node key file not yet supported on centrifuge chain. Remove node key file for now.
      // this.commonCentrifugeOptions.push('--node-key-file=/centrifuge/centrifuge/keys/' + config.centrifugeNodeKeyFile);
    }

    // Adding reserved nodes
    if (!isEmptyString(config.centrifugeReservedNodes)) {
      this.commonCentrifugeOptions.push(...formatOptionList('--reserved-nodes', config.centrifugeReservedNodes));
    }

    // Adding telemetry Url
    if (!isEmptyString(config.centrifugeTelemetryUrl)) {
      if (config.centrifugeTelemetryUrl === '--no-telemetry') {
        this.commonCentrifugeOptions.push('--no-telemetry');
      } else {
        this.commonCentrifugeOptions.push(...formatOptionList('--telemetry-url', config.centrifugeTelemetryUrl));
      }
    }

    // This variable will be set only in testing suite
    if (process.env.TESTING === undefined) {
      // Setting network mode
      this.networkMode = `container:${os.hostname()}`;
      console.log(`Container network mode: ${this.networkMode}...`);
    }

    // Get service volume from orchestrator and give this volume to centrifuge container
    const orchestratorServiceVolume = await this.docker.getMount(os.hostname(), 'service');
    if (orchestratorServiceVolume) {
      this.centrifugeVolume = orchestratorServiceVolume.Name;
    } else {
      this.centrifugeVolume = 'centrifuge-volume';
    }
    console.log(`Centrifuge will use volume '${this.centrifugeVolume}'...`);

    this.prepared = true;
  }

  // centrifuge start function
  async start (mode) {
    try {
      // Prepare service before start
      if (!this.prepared) {
        await this.prepareService();
      }

      // Launch service in specific mode
      let containerName = '';
      const cmdsList = ['centrifuge-chain'];
      if (mode === 'active') {
        let name = config.centrifugeName;
        if (!isEmptyString(config.centrifugeValidatorName)) {
          // force validator name
          name = config.centrifugeValidatorName;
        }
        cmdsList.push(...['--name', `${name}`, ...this.commonCentrifugeOptions, '--validator']);
        await this.startServiceContainer(
          'active',
          'centrifuge-validator',
          'centrifuge-sync',
          config.centrifugeImage,
          cmdsList,
          '/centrifuge',
          this.centrifugeVolume,
          this.networkMode
        );
        containerName = 'centrifuge-validator';
      } else if (mode === 'passive') {
        cmdsList.push(...['--name', `${config.centrifugeName}-${mode}`, ...this.commonCentrifugeOptions]);
        const contrainerNameSuffix = 'centrifuge-sync';
        containerName = contrainerNameSuffix;
        await this.startServiceContainer(
          'passive',
          'centrifuge-validator',
          containerName,
          config.centrifugeImage,
          cmdsList,
          '/centrifuge',
          this.centrifugeVolume,
          this.networkMode
        );
      } else {
        throw new Error(`Mode '${mode}' is unknown.`);
      }

      // Adding keys to centrifuge keystore if there is no already 4 keys
      if (this.importedKeys.length < 4) {
        // Waiting for 10 seconds to be sure that node was started
        await new Promise(resolve => setTimeout(resolve, 10000));
        await this.centrifugeKeysImport(containerName);
      }
      if (config.centrifugeSessionKeyToCheck) {
        await this.checkSessionKeyOnNode(containerName, config.centrifugeSessionKeyToCheck);
      }
    } catch (error) {
      debug('centrifugeStart', error);
      throw error;
    }
  }

  async extractPeers (peers, nodesRole, role) {
    if (!nodesRole.includes(role)) {
      return peers;
    }
    const result = [];
    const peersList = peers.toString().split(',');
    const nodesRoleList = nodesRole.toString().split(',');
    peersList.forEach((value, index) => {
      if (nodesRoleList[index].includes(role)) {
        result.push(value);
      }
    });
    console.log('extractPeers with role :[' + role + '] are [' + result.join() + ']');
    return result.join();
  }

  // Cleaning up centrifuge service
  async cleanUp () {
    try {
      // Checking if cleaning up process was already started
      if (!this.cleaningUp) {
        this.cleaningUp = true;
        console.log('Cleaning containers before exit...');
        await this.docker.removeContainer('centrifuge-sync');
        await this.docker.removeContainer('centrifuge-validator');
      } else {
        console.log('Cleaning up was already started...');
      }
      this.cleaningUp = false;
    } catch (error) {
      debug('cleanUp', error);
      console.error(error);
    }
  }

  // Remove 'down' container and start 'up' container
  async prepareAndStart (containerData, upName, downName) {
    try {
      // Get passive and active containers
      const containerUp = await this.docker.getContainer(upName);
      const containerDown = await this.docker.getContainer(downName);

      // Setting container name
      containerData.name = upName;

      // We must remove down container if it exist
      if (containerDown) {
        console.log(`Removing ${downName} container...`);
        await this.docker.removeContainer(downName);
      }

      // Creating up container if it is not already present
      if (!containerUp) {
        // Starting container
        console.log(`Starting ${upName} container...`);
        await this.docker.startContainer(containerData);
        return true;
      }

      // If container exits but is not in running state
      // We will recreate and relaunch it
      if (containerUp.description.State !== 'running') {
        console.log(`Restarting container ${containerData.name}...`);
        await this.docker.removeContainer(containerData.name);
        await this.docker.startContainer(containerData);
      }

      console.log('Service is already started.');
      return false;
    } catch (error) {
      debug('prepareAndStart', error);
      throw error;
    }
  };

  // Start passive or active service container
  async startServiceContainer (type, activeName, passiveName, image, cmd, mountTarget, mountSource, networkMode) {
    try {
      // Check if active service container is already running
      if (type === 'active' && await this.docker.isContainerRunning(activeName)) {
        console.log(`Service is already running in ${type} mode...`);
        return;
      }

      // Check if passive service container is already running
      if ((type === 'passive') && await this.docker.isContainerRunning(passiveName)) {
        console.log(`Service is already running in ${type} mode...`);
        return;
      }

      // Creating volume
      await this.docker.createVolume(mountSource);

      // Constructing container data
      const containerData = {
        name: '',
        Image: image,
        Cmd: cmd,
        HostConfig: {
          Mounts: [
            {
              Target: mountTarget,
              Source: mountSource,
              Type: 'volume',
              ReadOnly: false
            }
          ]
        }
      };

      if (networkMode !== '') {
        containerData.HostConfig.NetworkMode = networkMode;
      }

      // If we want to start active container
      if (type === 'active') {
        return await this.prepareAndStart(containerData, activeName, passiveName);
      // We want to start passive container
      } else {
        return await this.prepareAndStart(containerData, passiveName, activeName);
      }
    } catch (error) {
      debug('startServiceContainer', error);
      throw error;
    }
  }
}

module.exports = {
  Centrifuge
};
