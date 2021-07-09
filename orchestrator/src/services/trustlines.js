const debug = require('debug')('trustlines');

const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs-extra');

const {
  isEmptyString,
  readToObj,
  checkVariable
} = require('../utils');

const config = {};

class Trustlines {
  // Init configuration
  static initConfig () {
    try {
      // Get config from env variables
      dotenv.config();

      config.nodesRole = process.env.NODES_ROLE;
      config.nodeId = process.env.NODE_ID;

      config.trustlinesImage = process.env.TRUSTLINES_IMAGE;
      config.trustlinesAccount = process.env.TRUSTLINES_ACCOUNT;

      // Check if the config can be retrieved from config file
      if (isEmptyString(process.env.CONFIG_FILE)) {
        return;
      }

      if (isEmptyString(config.nodeId)) {
        throw Error('Trustlines Service need NODE_ID when config file was set.');
      }

      const configFromFile = readToObj('/config/config.json');

      if (isEmptyString(config.trustlinesImage)) {
        config.trustlinesImage = 'trustlines/tlbc-node:release';
      }

      if (isEmptyString(config.nodesRole)) {
        if ('nodesRole' in configFromFile) {
          config.nodesRole = configFromFile.nodesRole;
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
      checkVariable(config.trustlinesImage, 'Truslines Image');
    } catch (error) {
      debug('checkConfig', error);
      throw error;
    }
  }

  constructor (docker) {
    // If service is already cleaning up
    this.cleaningUp = false;

    this.docker = docker;

    // Init config
    Trustlines.initConfig();

    // Check config
    Trustlines.checkConfig();

    // Truslines volume init
    this.truslinesVolume = '';

    // Network mode init
    this.networkMode = '';

    // Service prepared
    this.prepared = false;
  }

  async isServiceReadyToStart (mode) {
    return true;
  }

  // Copy keys files to volume
  async copyFilesToServiceDirectory () {
    try {
      // Create directory
      await fs.ensureDir('/service/tlbc');
      await fs.ensureDir('/service/tlbc/key');
      await fs.ensureDir('/service/tlbc/db');
    } catch (error) {
      debug('copyFilesToServiceDirectory', error);
      throw error;
    }
  }

  // Check launched container
  async checkLaunchedContainer () {
    if (await this.docker.isContainerRunningByName('trustlines-validator')) {
      return 'active';
    }
    if (await this.docker.isContainerRunningByName('trustlines-sync')) {
      return 'passive';
    }
    return 'none';
  }

  // Prepare service before launch
  async prepareService () {
    if (fs.existsSync('/service')) {
      await this.copyFilesToServiceDirectory();
    }

    // This variable will be set only in testing suite
    if (process.env.TESTING === undefined) {
      // Setting network mode
      this.networkMode = `container:${os.hostname()}`;
      console.log(`Container network mode: ${this.networkMode}...`);
    }

    // Get service volume from orchestrator and give this volume to polkadot container
    const orchestratorServiceVolume = await this.docker.getMountThatEndsWith(os.hostname(), 'service');
    if (orchestratorServiceVolume) {
      this.truslinesVolume = orchestratorServiceVolume.Name;
    } else {
      this.truslinesVolume = 'trustlines-volume';
    }
    console.log(`Trustlines will use volume '${this.truslinesVolume}'...`);

    this.prepared = true;
  }

  // Trustlines start function
  async start (mode) {
    try {
      // Prepare service before start
      if (!this.prepared) {
        await this.prepareService();
      }
      console.log(`Trustlines start in mode '${mode}'...`);

      // Launch service in specific mode
      let containerName = '';

      if (mode === 'active') {
        const cmdsList = [
          '--role',
          'validator', // participant, observer
          '--address',
          config.trustlinesAccount,
          '--client-args',
          '--keys-path', '/trustlines/tlbc/key',
          '--password=/trustlines/tlbc/key/pass.pwd',
          '--db-path', '/trustlines/tlbc/db'
        ];
        await this.docker.startServiceContainer(
          'active',
          'trustlines-validator',
          'trustlines-sync',
          config.trustlinesImage,
          cmdsList,
          '/trustlines',
          this.truslinesVolume,
          this.networkMode
        );
        containerName = 'trustlines-validator';
      } else if (mode === 'passive') {
        containerName = 'trustlines-sync';
        const cmdsList = [
          '--role',
          'observer',
          '--client-args',
          '--keys-path', '/trustlines/tlbc/key',
          '--db-path', '/trustlines/tlbc/db'
        ];
        await this.docker.startServiceContainer(
          'passive',
          'trustlines-validator',
          containerName,
          config.trustlinesImage,
          cmdsList,
          '/trustlines',
          this.truslinesVolume,
          this.networkMode
        );
      } else {
        throw new Error(`Mode '${mode}' is unknown.`);
      }
    } catch (error) {
      debug('trustlines Start', error);
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
        await this.docker.removeContainer('trustlines-sync');
        await this.docker.removeContainer('trustlines-validator');
      } else {
        console.log('Cleaning up was already started...');
      }
      this.cleaningUp = false;
    } catch (error) {
      debug('cleanUp', error);
      console.error(error);
    }
  }

  getDatabasePath () {
    throw Error('Trustlines backup not implemented.');
  }

  getBackupURL () {
    throw Error('Trustlines backup not implemented.');
  }
}

module.exports = {
  Trustlines
};
