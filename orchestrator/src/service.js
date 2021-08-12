const { Polkadot } = require('./services/polkadot/polkadot');

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
    this.mode = mode;
    return await this.serviceInstance.start(mode);
  }

  // Cleanup a service
  async serviceCleanUp () {
    return await this.serviceInstance.cleanUp();
  }

  // Check if service is ready
  async serviceReady () {
    return await this.serviceInstance.isServiceReadyToStart(this.mode);
  }

  // Check service
  async serviceCheck () {
    return await this.serviceInstance.checkLaunchedContainer();
  }

  // Get service instance information
  async getServiceInfo () {
    return await this.serviceInstance.getInfo();
  }
}

module.exports = { Service };
