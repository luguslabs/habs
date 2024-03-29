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
    this.mode = 'none';
  }

  // Bootstrap service
  async serviceBootstrap (configDirectory, serviceDataDirectory) {
    return await this.serviceInstance.bootstrap(configDirectory, serviceDataDirectory);
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
    return {
      service: this.serviceName,
      isServiceReadyToStart: await this.serviceReady(),
      serviceContainer: await this.serviceCheck(),
      serviceMode: this.mode,
      ...(await this.serviceInstance.getInfo())
    };
  }
}

module.exports = { Service };
