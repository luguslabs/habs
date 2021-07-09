const { Polkadot } = require('./services/polkadot');
const { Trustlines } = require('./services/trustlines');
const { Centrifuge } = require('./services/centrifuge');
const { Docker } = require('./docker');
const debug = require('debug')('service');

class Service {
  constructor (serviceName, chain, mode) {
    try {
      // Create docker instance
      const docker = new Docker();

      // Create a service instance
      switch (serviceName) {
        case 'polkadot':
          this.serviceInstance = new Polkadot(docker);
          break;
        case 'trustlines':
          this.serviceInstance = new Trustlines(docker);
          break;
        case 'centrifuge':
          this.serviceInstance = new Centrifuge(docker);
          break;
        default:
          throw Error(`Service ${serviceName} is not supported yet.`);
      }

      this.chain = chain;
      this.serviceName = serviceName;

      // Service not ready and node is in active mode
      this.noReadyCount = 0;
      this.noReadyThreshold = 30; // ~ 300 seconds

      // Set initial service mode
      this.mode = mode;
    } catch (error) {
      debug('Service constructtor', error);
      throw error;
    }
  }

  // Service readiness management
  async serviceReadinessManagement () {
    const serviceReady = await this.serviceInstance.isServiceReadyToStart();

    // If service is not ready and current node is leader
    if (!serviceReady && this.mode === 'active') {
      // Waiting for this.noReadyThreshold orchestrations
      if (this.noReadyCount < this.noReadyThreshold) {
        console.log(
              `Service is not ready but current node is leader. Waiting for ${
                this.noReadyThreshold - this.noReadyCount
              } orchestrations...`
        );
        this.noReadyCount++;
        return true;
        // If service is not ready after noReadyThreshold enforcing passive mode
        // And disabling heartbeats send
      } else {
        console.log(
              `Service is not ready for ${this.noReadyThreshold} orchestrations. Disabling heartbeat send...`
        );
        this.chain.heartbeatSendEnabled = false;
        return false;
      }
    }

    // If service is ready and heartbeat send is disabled we can activate heartbeats send
    if (serviceReady && !this.chain.heartbeatSendEnabled) {
      console.log(
        'Service is ready and heartbeat send was disabled. Enabling it...'
      );
      this.chain.heartbeatSendEnabled = true;
    }

    // Reset noReady counter
    if (this.noReadyCount !== 0) {
      this.noReadyCount = 0;
    }

    // Return isServiceReadyToStart result
    return serviceReady;
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
}

module.exports = { Service };
