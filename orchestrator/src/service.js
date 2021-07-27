const debug = require('debug')('service');

const { Polkadot } = require('./services/polkadot/service');

class Service {
  constructor (serviceName) {
    // Create a service instance
    switch (serviceName) {
      case 'polkadot':
        this.serviceInstance = new Polkadot();
        break;
      default:
        throw Error(`Service ${serviceName} is not supported yet.`);
    }
    this.serviceName = serviceName;
    this.mode = 'passive';
  }

  // Start service
  async serviceStart (mode) {
    await this.serviceInstance.start(mode);
    this.mode = mode;
  }

  // Check if service is ready
  async serviceReady () {
    return await this.serviceInstance.isServiceReadyToStart(this.mode);
  }

  // Check service
  async serviceCheck () {
    return await this.serviceInstance.checkLaunchedContainer();
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
}

module.exports = { Service };
