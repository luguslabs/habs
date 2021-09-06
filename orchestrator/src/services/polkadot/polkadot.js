const os = require('os');
const fs = require('fs-extra');
const { u8aToHex } = require('@polkadot/util');
const debug = require('debug')('polkadot');

const {
  getKeysFromSeed,
  isEmptyString,
  formatOptionList,
  formatOptionCmds,
  copyAFile
} = require('../../utils');
const { Docker } = require('../../docker');
const { constructConfiguration } = require('./config');

class Polkadot {
  constructor () {
    // If service is already cleaning up
    this.cleaningUp = false;

    // Already imported keys list
    this.importedKeys = [];

    // Creating docker instance
    this.docker = new Docker();

    // Init config
    this.config = constructConfiguration();

    // Polkadot volume init
    this.polkadotVolume = '';
    this.polkadotVolume2 = '';

    // Common PolkadotOptions
    this.commonPolkadotOptions = [];

    // Network mode init
    this.networkMode = '';

    // Service prepared
    this.prepared = false;

    // Setting polkadot name
    this.name = this.config.polkadotName;
  }

  // Bootstrap service before start
  async bootstrap (configDirectory, serviceDataDirectory) {
    // If polkadot is configured to use a custom keyfile
    if (this.config.polkadotNodeKeyFile && fs.existsSync(configDirectory) && fs.existsSync(serviceDataDirectory)) {
      console.log(`Copying polkadot node key file (${this.config.polkadotNodeKeyFile}) from ${configDirectory} to ${serviceDataDirectory}...`);
      copyAFile(configDirectory, `${serviceDataDirectory}/keys`, this.config.polkadotNodeKeyFile, this.config.polkadotUnixUserId, this.config.polkadotUnixGroupId);
    }
  }

  // Importing a key in keystore
  async importKey (containerName, mnemonic, crypto, type) {
    // Get public key hex from mnemonic
    const keys = await getKeysFromSeed(mnemonic, crypto);
    const publicKey = u8aToHex(keys.publicKey);

    // Check if the key was already imported
    if (this.importedKeys.includes(publicKey)) {
      debug('importKey', `Key ${publicKey} was already imported to keystore...`);
      return false;
    }

    debug('importKey', `Importing ${type} ${publicKey} to ${containerName}...`);

    // Constructing command to import key
    const command = ['curl', 'http://localhost:' + this.config.polkadotRpcPort.toString(), '-H', 'Content-Type:application/json;charset=utf-8', '-d',
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
    debug('importKey', `Command result: "${result}"`);

    // If docker execute failed we will return false
    if (!result) {
      return false;
    }

    // Checking command result
    if (!result.includes('"result":null')) {
      console.log(`Can't add key. ${type} - ${publicKey}. Will retry the next time...`);
    } else {
      console.log(`The ${type} - ${publicKey} key was successfully added to service keystore.`);
    }

    // Check if key is present in containers file system
    const keyAdded = await this.checkKeyAdded(containerName, publicKey, type);
    if (!keyAdded) {
      console.log(`Key (${type} - ${publicKey}) can not be found in container. Will retry to add the next time...`);
      return false;
    }

    // Add key into imported key list
    this.importedKeys.push(publicKey);
    return true;
  }

  // Check if a key was successfully added
  async checkKeyAdded (containerName, key, keyType) {
    // Constructing command to check a key
    const command = ['curl', 'http://localhost:' + this.config.polkadotRpcPort.toString(), '-H', 'Content-Type:application/json;charset=utf-8', '-d',
      `{
        "jsonrpc":"2.0",
        "id":1,
        "method":"author_hasKey",
        "params": [
          "${key}",
          "${keyType}"
        ]
      }`];

    // Executing command in docker container
    const result = await this.docker.dockerExecute(containerName, command);
    debug('checkKeyAdded', `HasKey command result: "${result}"`);

    // If docker execute failed we will return false
    if (!result) {
      return false;
    }

    return result.includes('true');
  }

  // Expose service info use in API
  async getInfo () {
    const mode = await this.checkLaunchedContainer();
    return {
      sessionKeysString: this.config.polkadotSessionKeyToCheck,
      checkSessionKeysOnNode: await this.checkSessionKeysOnNode(mode),
      launchedContainer: mode
    };
  }

  // Check if session keys were successfully set
  async checkSessionKeysOnNode (mode) {
    try {
      // Which container we must check
      const containerName = mode === 'active' ? this.config.polkadotPrefix + 'polkadot-validator' : this.config.polkadotPrefix + 'polkadot-sync';

      // Check if session key was set
      if (!this.config.polkadotSessionKeyToCheck) {
        debug('polkadotSessionKeyToCheck must be set to use checkSessionKeysOnNode functionality');
        return false;
      }

      debug('checkSessionKeyOnNode', `Checking session keys on node: ${this.config.polkadotSessionKeyToCheck}`);
      // Constructing command to check session key
      const command = ['curl', 'http://localhost:' + this.config.polkadotRpcPort.toString(), '-H', 'Content-Type:application/json;charset=utf-8', '-d',
      `{
        "jsonrpc":"2.0",
        "id":1,
        "method":"author_hasSessionKeys",
        "params": [
          "${this.config.polkadotSessionKeyToCheck}"
        ]
      }`];

      // Executing command to check session keys
      const result = await this.docker.dockerExecute(containerName, command);
      debug('checkSessionKeyOnNode', `Author_hasSessionKeys result: "${result}"`);

      // If docker execute failed we will return false
      if (!result) {
        return false;
      }

      return result.includes('true');
    } catch (error) {
      debug('checkSessionKeysOnNode', error);
      return false;
    }
  }

  // Import wallets to polkadot keystore
  async polkadotKeysImport (containerName) {
    try {
      // Check if there is no already 6 keys added
      if (this.importedKeys.length >= 6) {
        debug('polkadotKeysImport', 'There are aleady 6 or more keys in the keystore.');
        return false;
      }
      console.log('Waiting 5 seconds before importing keys...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Importing 6 validator keys into keystore
      console.log('Importing keys to keystore...');
      await this.importKey(containerName, this.config.polkadotKeyGran, 'ed25519', 'gran');
      await this.importKey(containerName, this.config.polkadotKeyBabe, 'sr25519', 'babe');
      await this.importKey(containerName, this.config.polkadotKeyImon, 'sr25519', 'imon');
      await this.importKey(containerName, this.config.polkadotKeyPara, 'sr25519', 'para');
      await this.importKey(containerName, this.config.polkadotKeyAsgn, 'sr25519', 'asgn');
      await this.importKey(containerName, this.config.polkadotKeyAudi, 'sr25519', 'audi');

      return true;
    } catch (error) {
      debug('polkadotKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      return false;
    }
  }

  // Check if polkadot node is ready to operate
  async isServiceReadyToStart (mode) {
    try {
      // Which container we must check
      const containerName = mode === 'active' ? this.config.polkadotPrefix + 'polkadot-validator' : this.config.polkadotPrefix + 'polkadot-sync';

      // Check if container exists and is running
      const containerExistAndRunning = await this.docker.isContainerRunning(containerName);
      if (!containerExistAndRunning) {
        debug('isServiceReadyToStart', `Service is not ready to start. Container : "${containerName}" is not running. `);
        return false;
      }

      // Check if a simulate synch option was set
      if (this.config.polkadotSimulateSynch) {
        debug('isServiceReadyToStart', 'Test mode simulate synch node.');
        return true;
      }

      // Construct command to check node system_health
      const commandSystemHealth = ['curl', 'http://localhost:' + this.config.polkadotRpcPort.toString(), '-H', 'Content-Type:application/json;charset=utf-8', '-d',
                       `{
                        "jsonrpc":"2.0",
                        "id":1,
                        "method":"system_health"
      }`];

      // Call system_health command in docker container
      const resultSystemHealth = await this.docker.dockerExecute(containerName, commandSystemHealth);
      debug('isServiceReadyToStart', `Command system_health result: "${resultSystemHealth}"`);

      // If docker execute failed we will return false
      if (!resultSystemHealth) {
        return false;
      }

      // Checking if system_health gives a result
      if (!resultSystemHealth.includes('"result":')) {
        debug('isServiceReadyToStart', 'system_health call has no result. Service is not ready.');
        return false;
      }

      // Get peers info
      const peersSystemHealth = resultSystemHealth.match(/"peers":\d+/);
      debug('isServiceReadyToStart', 'peersSystemHealth:' + peersSystemHealth);

      // Check if peers info is available
      if (!peersSystemHealth || peersSystemHealth.length !== 1) {
        debug('isServiceReadyToStart', 'system_health call has no peers result. Service is not ready.');
        return false;
      }

      // Check if polkadot node has peers
      const peersNumber = parseInt(peersSystemHealth[0].split(':')[1]);
      debug('isServiceReadyToStart', `system_health peers :"${peersNumber}" peers.`);
      if (peersNumber <= 0) {
        debug('isServiceReadyToStart', 'system_health peers == 0. Service us not ready.');
        return false;
      }

      // Check if node is synching
      const isSyncingSystemHealth = resultSystemHealth.match(/"isSyncing":true|false/).toString();
      debug('isServiceReadyToStart', 'isSyncingSystemHealth:' + isSyncingSystemHealth);
      if (isSyncingSystemHealth.includes('true')) {
        debug('isServiceReadyToStart', 'Node is currently syncing. Service is not ready.');
        return false;
      }

      // Check if all keys were added to keystore
      if (this.importedKeys.length < 6) {
        debug('isServiceReadyToStart', 'Servie is not ready for cause not all keys where added to keystore.');
        return false;
      }

      // If no return was triggered till now considering that service is ready
      return true;
    } catch (error) {
      debug('isServiceReadyToStart', error);
      return false;
    }
  }

  // Check launched container
  async checkLaunchedContainer () {
    if (await this.docker.isContainerRunning(this.config.polkadotPrefix + 'polkadot-validator')) {
      return 'active';
    }
    if (await this.docker.isContainerRunning(this.config.polkadotPrefix + 'polkadot-sync')) {
      return 'passive';
    }
    return 'none';
  }

  // Prepare service before launch
  async prepareService () {
    // Common polkadot options
    this.commonPolkadotOptions = [
      '--prometheus-external',
      '--prometheus-port',
      '9615',
      '--rpc-cors',
      'http://localhost',
      '--rpc-port',
      this.config.polkadotRpcPort.toString()
    ];

    // Setting pruning if archive node
    if (this.config.polkadotArchiveNode) {
      this.commonPolkadotOptions.push('--pruning=archive');
    }

    // Adding additional Polkadot Option Commands
    if (!isEmptyString(this.config.polkadotAdditionalOptions)) {
      this.commonPolkadotOptions.push(...formatOptionCmds(this.config.polkadotAdditionalOptions));
    }

    // If polkadotNodeKeyFile variable is set
    // And service directory exists use node key file
    if (!isEmptyString(this.config.polkadotNodeKeyFile)) {
      this.commonPolkadotOptions.push(`--node-key-file=${this.config.databasePath}/keys/` + this.config.polkadotNodeKeyFile);
    }

    // Adding reserved nodes
    if (!isEmptyString(this.config.polkadotReservedNodes)) {
      this.commonPolkadotOptions.push(...formatOptionList('--reserved-nodes', this.config.polkadotReservedNodes));
    }

    // Adding telemetry Url
    if (!isEmptyString(this.config.polkadotTelemetryUrl)) {
      if (this.config.polkadotTelemetryUrl === '--no-telemetry') {
        this.commonPolkadotOptions.push('--no-telemetry');
      } else {
        this.commonPolkadotOptions.push(...formatOptionList('--telemetry-url', this.config.polkadotTelemetryUrl));
      }
    }

    // In testing mode the network will not be attached to orchestrator container
    if (!this.config.testing) {
      // Setting network mode
      this.networkMode = `container:${os.hostname()}`;
      console.log(`Container network mode: ${this.networkMode}...`);
    }

    // Get service volume from orchestrator and give this volume to polkadot container
    const orchestratorServiceVolume = await this.docker.getMount(os.hostname(), 'service');

    if (orchestratorServiceVolume) {
      this.polkadotVolume = orchestratorServiceVolume.Name;
    } else {
      this.polkadotVolume = this.config.polkadotPrefix + 'polkadot-volume';
    }
    console.log(`Polkadot will use volume 1 '${this.polkadotVolume}'...`);

    // This is the fix to avoid multiple volumes creation
    // Normally volume in official polkadot container will be changed in latest releases
    const orchestratorServiceVolume2 = await this.docker.getMount(os.hostname(), 'service2');

    if (orchestratorServiceVolume2) {
      this.polkadotVolume2 = orchestratorServiceVolume2.Name;
    } else {
      this.polkadotVolume2 = this.config.polkadotPrefix + 'polkadot-volume2';
    }
    console.log(`Polkadot will use volume 2 '${this.polkadotVolume2}'...`);

    // Mark service as prepared
    this.prepared = true;
  }

  // Remove 'down' container and start 'up' container
  async prepareAndStart (containerData, upName, downName) {
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
      return await this.docker.startContainer(containerData);
    }

    // If container exits but is not in running state
    // We will recreate and relaunch it
    if (!await this.docker.isContainerRunning(upName)) {
      console.log(`Restarting container ${containerData.name}...`);
      await this.docker.removeContainer(containerData.name);
      return await this.docker.startContainer(containerData);
    }

    console.log('Service is already started.');
    return false;
  };

  // Start passive or active service container
  // TODO: Remove second mount when it will be removed from official docker container
  async startServiceContainer (type, activeName, passiveName, image, cmd, mountTarget, mountSource, networkMode, mountTarget2, mountSource2) {
    // Check if active service container is already running
    if (type === 'active' && await this.docker.isContainerRunning(activeName)) {
      console.log(`Service is already running in ${type} mode...`);
      return false;
    }

    // Check if passive service container is already running
    if (type === 'passive' && await this.docker.isContainerRunning(passiveName)) {
      console.log(`Service is already running in ${type} mode...`);
      return false;
    }

    // Creating volume
    await this.docker.createVolume(mountSource);

    // Creating second volume to fix orphelin volumes
    await this.docker.createVolume(mountSource2);

    // Constructing mount data
    const mounts = [];
    mounts.push({
      Target: mountTarget,
      Source: mountSource,
      Type: 'volume',
      ReadOnly: false
    });

    mounts.push({
      Target: mountTarget2,
      Source: mountSource2,
      Type: 'volume',
      ReadOnly: false
    });

    // Constructing container data
    const containerData = {
      name: '',
      Image: image,
      Cmd: cmd,
      HostConfig: {
        Mounts: mounts
      }
    };

    if (networkMode !== '') {
      containerData.HostConfig.NetworkMode = networkMode;
    }

    // If we want to start active container
    if (type === 'active') {
      return await this.prepareAndStart(containerData, activeName, passiveName);
    // We want to start passive container
    }
    if (type === 'passive') {
      return await this.prepareAndStart(containerData, passiveName, activeName);
    }

    // If here the service type is unknown
    throw new Error(`Service type '${type}' is unknown.`);
  }

  // Polkadot start function
  async start (mode) {
    // Prepare service before start
    if (!this.prepared) {
      await this.prepareService();
    }

    // Start service in active mode
    if (mode === 'active') {
      // Active node name
      let activeNodeName = `${this.name}-${mode}`;

      // Force active node name if polkadotValidatorName variable is set
      if (!isEmptyString(this.config.polkadotValidatorName)) {
        activeNodeName = this.config.polkadotValidatorName;
      }

      // Start active service container
      const serviceStarted = await this.startServiceContainer(
        'active',
        this.config.polkadotPrefix + 'polkadot-validator',
        this.config.polkadotPrefix + 'polkadot-sync',
        this.config.polkadotImage,
        ['--name', activeNodeName, ...this.commonPolkadotOptions, '--validator'],
        this.config.databasePath,
        this.polkadotVolume,
        this.networkMode,
        '/polkadot',
        this.polkadotVolume2
      );

      if (serviceStarted) {
        // Import keys to service container
        await this.polkadotKeysImport(this.config.polkadotPrefix + 'polkadot-validator');
      }
      return serviceStarted;
    }

    // Start service in passive mode
    if (mode === 'passive') {
      // Start passive service container
      const serviceStarted = await this.startServiceContainer(
        'passive',
        this.config.polkadotPrefix + 'polkadot-validator',
        this.config.polkadotPrefix + 'polkadot-sync',
        this.config.polkadotImage,
        ['--name', `${this.name}-${mode}`, ...this.commonPolkadotOptions],
        this.config.databasePath,
        this.polkadotVolume,
        this.networkMode,
        '/polkadot',
        this.polkadotVolume2
      );

      if (serviceStarted) {
        // Import keys to service container
        await this.polkadotKeysImport(this.config.polkadotPrefix + 'polkadot-sync');
      }

      return serviceStarted;
    }

    // If here the service mode is unknown
    throw new Error(`Mode '${mode}' is unknown.`);
  }

  // Cleaning up polkadot service
  async cleanUp () {
    try {
      // Checking if cleaning up process was already started
      if (!this.cleaningUp) {
        this.cleaningUp = true;
        console.log('Cleaning up containers...');
        await this.docker.removeContainer(this.config.polkadotPrefix + 'polkadot-sync');
        await this.docker.removeContainer(this.config.polkadotPrefix + 'polkadot-validator');
      } else {
        console.log('Cleaning up was already started...');
        return false;
      }
      this.cleaningUp = false;
      return true;
    } catch (error) {
      debug('cleanUp', error);
      this.cleaningUp = false;
      return false;
    }
  }
}

module.exports = {
  Polkadot
};
