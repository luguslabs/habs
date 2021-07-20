const debug = require('debug')('service');

const { Polkadot } = require('./services/polkadot');
const { Trustlines } = require('./services/trustlines');
const { Centrifuge } = require('./services/centrifuge');
const { isEmptyString } = require('./utils');

class Service {
  constructor (serviceName, mode) {
    try {
      // Create a service instance
      switch (serviceName) {
        case 'polkadot':
          this.serviceInstance = new Polkadot();
          break;
        case 'trustlines':
          this.serviceInstance = new Trustlines();
          break;
        case 'centrifuge':
          this.serviceInstance = new Centrifuge();
          break;
        default:
          throw Error(`Service ${serviceName} is not supported yet.`);
      }

      this.serviceName = serviceName;
      this.mode = mode;
    } catch (error) {
      debug('Service constructtor', error);
      throw error;
    }
  }

  // Check if service is ready
  async serviceReady () {
    try {
      const isServiceReady = await this.serviceInstance.isServiceReadyToStart();
      return isServiceReady;
    } catch (error) {
      debug('serviceReady', error);
      throw error;
    }
  }

  // Check service
  async serviceCheck () {
    try {
      const serviceStatus = await this.serviceInstance.checkLaunchedContainer();
      return serviceStatus;
    } catch (error) {
      debug('serviceCheck', error);
      throw error;
    }
  }

  // Start service
  async serviceStart (mode) {
    try {
      await this.serviceInstance.start(mode);
      this.mode = mode;
    } catch (error) {
      debug('serviceStart', error);
      throw error;
    }
  }

  // Cleanup a service
  async serviceCleanUp () {
    try {
      await this.serviceInstance.cleanUp();
    } catch (error) {
      debug('serviceCleanUp', error);
      console.error(error);
    }
  }

  // Get service database PATH
  serviceDatabasePath () {
    try {
      if (!isEmptyString(this.serviceInstance.config.databasePath)) {
        return this.serviceInstance.config.databasePath;
      }
      return false;
    } catch (error) {
      debug('serviceDatabasePath', error);
      throw error;
    }
  }

  // Get service backup URL
  serviceBackupURL () {
    try {
      if (!isEmptyString(this.serviceInstance.config.backupURL)) {
        return this.serviceInstance.config.backupURL;
      }
      return false;
    } catch (error) {
      debug('serviceBackupURL', error);
      throw error;
    }
  }
}

module.exports = { Service };
