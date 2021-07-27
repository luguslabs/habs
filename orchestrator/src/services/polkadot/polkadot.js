const os = require('os');
const fs = require('fs-extra');
const { u8aToHex } = require('@polkadot/util');
const debug = require('debug')('polkadot');

const {
  getKeysFromSeed,
  isEmptyString,
  formatOptionList,
  formatOptionCmds
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

    // Common PolkadotOptions
    this.commonPolkadotOptions = [];

    // Network mode init
    this.networkMode = '';

    // Service prepared
    this.prepared = false;
  }

  // Importing a key in keystore
  async importKey (containerName, mnemonic, crypto, type) {
    // Get public key hex from mnemonic
    const keys = await getKeysFromSeed(mnemonic, crypto);
    const publicKey = u8aToHex(keys.publicKey);

    // Check if the key was already imported
    if (this.importedKeys.includes(publicKey)) {
      debug('importKey', `Key ${publicKey} was already imported to keystore...`);
      return;
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

    // Checking command result
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

    console.log(`The ${publicKey} key was successfully added to service keystore.`);
  }

  // Import wallets to polkadot keystore
  async polkadotKeysImport (containerName) {
    try {
      // Adding keys to polkadot keystore if there is no already 5 keys
      if (this.importedKeys.length < 5) {
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
      }
      // if (this.config.polkadotSessionKeyToCheck) {
      //  await this.checkSessionKeyOnNode(containerName, this.config.polkadotSessionKeyToCheck);
      // }
    } catch (error) {
      debug('polkadotKeysImport', error);
      console.error('Error: Can\'t add keys. We will retry the next time.');
      console.error(error);
    }
  }

  // Check if session keys were successfully set
  async checkSessionKeyOnNode (containerName, sessionKey) {
    try {
      debug('checkSessionKeyOnNode', `Checking Session Key validity on node for session key value : ${sessionKey}`);
      // Constructing command check session key
      const command = ['curl', 'http://localhost:' + this.config.polkadotRpcPort.toString(), '-H', 'Content-Type:application/json;charset=utf-8', '-d',
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
      debug('checkSessionKeyOnNode', `Command hasSessionKeys result: "${result}"`);
      return result;
    } catch (error) {
      debug('checkSessionKeyOnNode', error);
      console.error('Error: Can\'t check session key');
      console.error(error);
      return false;
    }
  }

  // Check if a key file is present in container file system
  async checkKeyAdded (mnemonic, crypto, containerName) {
    const keys = await getKeysFromSeed(mnemonic, crypto);
    const publicKey = u8aToHex(keys.publicKey);

    // Construct command to execute
    const command = [
      'find',
      this.config.databasePath,
      '-name',
      `*${publicKey.substring(2)}`
    ];

    debug('checkKeyAdded', `Command executed: "${command}"`);

    // Call find command in container
    const result = await this.docker.dockerExecute(containerName, command);
    debug('checkKeyAdded', `Command find key result: "${result}"`);

    return !!result;
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
      const isSyncingSystemHealth = resultSystemHealth.match(/"isSyncing":true|false/);
      debug('isServiceReadyToStart', 'isSyncingSystemHealth:' + isSyncingSystemHealth);
      if (isSyncingSystemHealth.includes('true')) {
        debug('isServiceReadyToStart', 'Node is currently syncing. Service is not ready.');
        return false;
      }

      // If no return was triggered considering that service is ready
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // Copy keys files to volume
  async copyFilesToServiceDirectory () {
    // Create keys directory
    await fs.ensureDir('/service/keys');

    // Copy polkadot node key file
    console.log(`Copying ${this.config.polkadotNodeKeyFile} from /config/ to /service/keys/...`);
    await fs.copy(`/config/${this.config.polkadotNodeKeyFile}`, `/service/keys/${this.config.polkadotNodeKeyFile}`);

    // Fix permissions
    await fs.chown('/service', this.config.polkadotUnixUserId, this.config.polkadotUnixGroupId);
    await fs.chown('/service/keys', this.config.polkadotUnixUserId, this.config.polkadotUnixGroupId);
    await fs.chown(`/service/keys/${this.config.polkadotNodeKeyFile}`, this.config.polkadotUnixUserId, this.config.polkadotUnixGroupId);
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
      '--pruning=archive',
      '--rpc-cors',
      'http://localhost',
      '--rpc-port',
      this.config.polkadotRpcPort.toString()
    ];

    // Adding additional Polkadot Option Commands
    if (!isEmptyString(this.config.polkadotAdditionalOptions)) {
      this.commonPolkadotOptions.push(...formatOptionCmds(this.config.polkadotAdditionalOptions));
    }

    // If polkadotNodeKeyFile variable is set
    // And service directory exists use node key file
    if (!isEmptyString(this.config.polkadotNodeKeyFile) && fs.existsSync('/service')) {
      await this.copyFilesToServiceDirectory();
      this.commonPolkadotOptions.push('--node-key-file=/polkadot/keys/' + this.config.polkadotNodeKeyFile);
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
    console.log(`Polkadot will use volume '${this.polkadotVolume}'...`);

    // Mark service as prepared
    this.prepared = true;
  }

  // Polkadot start function
  async start (mode) {
    // Prepare service before start
    if (!this.prepared) {
      await this.prepareService();
    }

    // Start service in active mode
    if (mode === 'active') {
      let name = this.config.polkadotName;
      // Avoid name change for 1000 validator program check on KUSAMA network
      if (!isEmptyString(this.config.polkadotAdditionalOptions) && this.config.polkadotAdditionalOptions.includes('kusama')) {
        name = this.config.polkadotName.slice(0, -2);
      }

      // Force validator name
      if (!isEmptyString(this.config.polkadotValidatorName)) {
        name = this.config.polkadotValidatorName;
      }

      // Start active service container
      await this.startServiceContainer(
        'active',
        this.config.polkadotPrefix + 'polkadot-validator',
        this.config.polkadotPrefix + 'polkadot-sync',
        this.config.polkadotImage,
        ['--name', `${name}`, ...this.commonPolkadotOptions, '--validator'],
        '/polkadot',
        this.polkadotVolume,
        this.networkMode
      );

      // Import keys to service container
      await this.polkadotKeysImport(this.config.polkadotPrefix + 'polkadot-validator');

      return;
    }

    // Start service in passive mode
    if (mode === 'passive') {
      // Start passive service container
      await this.startServiceContainer(
        'passive',
        this.config.polkadotPrefix + 'polkadot-validator',
        this.config.polkadotPrefix + 'polkadot-sync',
        this.config.polkadotImage,
        ['--name', `${this.config.polkadotName}-${mode}`, ...this.commonPolkadotOptions],
        '/polkadot',
        this.polkadotVolume,
        this.networkMode
      );

      // Import keys to service container
      await this.polkadotKeysImport(this.config.polkadotPrefix + 'polkadot-sync');

      return;
    }

    // If here the service mode is unknown
    throw new Error(`Mode '${mode}' is unknown.`);
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
      await this.docker.startContainer(containerData);
      return true;
    }

    // If container exits but is not in running state
    // We will recreate and relaunch it
    if (this.docker.isContainerRunning(upName)) {
      console.log(`Restarting container ${containerData.name}...`);
      await this.docker.removeContainer(containerData.name);
      await this.docker.startContainer(containerData);
    }

    console.log('Service is already started.');
    return false;
  };

  // Start passive or active service container
  async startServiceContainer (type, activeName, passiveName, image, cmd, mountTarget, mountSource, networkMode) {
    // Check if active service container is already running
    if (type === 'active' && await this.docker.isContainerRunning(activeName)) {
      console.log(`Service is already running in ${type} mode...`);
      return;
    }

    // Check if passive service container is already running
    if (type === 'passive' && await this.docker.isContainerRunning(passiveName)) {
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
  }

  // Cleaning up polkadot service
  async cleanUp () {
    try {
      // Checking if cleaning up process was already started
      if (!this.cleaningUp) {
        this.cleaningUp = true;
        console.log('Cleaning containers before exit...');
        await this.docker.removeContainer(this.config.polkadotPrefix + 'polkadot-sync');
        await this.docker.removeContainer(this.config.polkadotPrefix + 'polkadot-validator');
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
