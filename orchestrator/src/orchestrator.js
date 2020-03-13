const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const { Polkadot } = require('./polkadot');
const { Docker } = require('./docker');

class Orchestrator {
  // Check if service is supported and create service instance
  static createServiceInstance (serviceName) {
    try {
      if (serviceName === 'polkadot') {
        // Create docker instance
        const docker = new Docker();
        // Create and return Polkadot instance
        return new Polkadot(docker);
      } else {
        throw Error(`Service ${serviceName} is not supported yet.`);
      }
    } catch (error) {
      debug('createServiceInstance', error);
      throw error;
    }
  }

  constructor (chain, service, metrics, mnemonic, aliveTime, suspendService) {
    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;
    this.chain = chain;
    // Create service instance
    this.service = Orchestrator.createServiceInstance(service);
    this.metrics = metrics;
    this.mnemonic = mnemonic;
    this.aliveTime = aliveTime;
    this.suspendService = suspendService.includes('true');
  }

  // Orchestrate service
  async orchestrateService () {
    try {
      console.log('Orchestrating service...');

      // If node state permits to send transactions
      console.log('Checking if Archipel chain node can receive transactions...');
      const sendTransaction = await this.chain.canSendTransactions();
      if (!sendTransaction) {
        console.log('Archipel chain node can\'t receive transactions. Enforcing \'passive\' service mode...');
        this.serviceStart('passive');
        return;
      }

      // Check if service was not suspended
      console.log('Checking if service was not suspended...');
      if (this.suspendService) {
        console.log('ARCHIPEL_SUSPEND_SERVICE is set to true. Enforcing \'passive\' service mode...');
        this.serviceStart('passive');
        return;
      }

      // Check if service is ready to start in active mode
      console.log('Checking is service is ready to start...');
      const serviceReady = await this.isServiceReadyToStart();
      if (!serviceReady) {
        console.log('Service not ready. Enforcing \'passive\' service mode...');
        this.serviceStart('passive');
        return;
      }

      // Get node address from seed
      const key = await getKeysFromSeed(this.mnemonic);
      const nodeKey = key.address;
      debug('orchestrateService', `Current Node Key: ${nodeKey}`);

      // Check if anyone is alive
      console.log('Checking is anyone in federation is alive...');
      if (!this.metrics.anyOneAlive(nodeKey, this.aliveTime)) {
        console.log('Seems that no one is alive. Enforcing \'passive\' service mode...');
        this.serviceStart('passive');
        return;
      }

      // Check node leadership
      console.log('Checking node leadership...');
      const leadership = await this.leadershipManagement(nodeKey);

      if (!leadership) {
        console.log('The current node is not leader. Enforcing \'passive\' service mode...');
        this.serviceStart('passive');
        return;
      }

      // If all checks passed we can start service in active mode
      console.log('All checks passed. Launching service in active mode...');
      await this.serviceStart('active');
    } catch (error) {
      debug('orchestrateService', error);
      throw error;
    }
  }

  // Take leader place
  async becomeLeader (nodeKey) {
    try {
      const setLeader = await this.chain.setLeader(nodeKey, this.mnemonic); ;
      if (setLeader) {
        console.log('The leadership was taken successfully...');
        return true;
      } else {
        console.log('Failed to take leadership. Possibly other node already took leadership...');
        return false;
      }
    } catch (error) {
      debug('becomeLeader', error);
      throw error;
    }
  }

  // Manage leadership
  // Returns true if node is leader or was able to take leadership
  async leadershipManagement (nodeKey) {
    try {
      // Get current leader from chain
      let currentLeader = await this.chain.getLeader();
      currentLeader = currentLeader.toString();

      // If current leader is empty
      // First time Archipel boot
      if (currentLeader === '') {
        console.log('Trying to take leadership...');
        const becomeLeaderResult = await this.becomeLeader(nodeKey);
        return becomeLeaderResult;
      }

      // If this node is current leader
      if (currentLeader === nodeKey) {
        console.log('Current node is leader...');
        return true;
      }

      // Other node is leader
      debug('orchestrateService', `Current Leader is: ${currentLeader}`);
      console.log('Other node is leader...');

      const otherLeaderActionResult = await this.otherLeaderAction(currentLeader, nodeKey);
      return otherLeaderActionResult;
    } catch (error) {
      debug('leadershipManagement', error);
      throw error;
    }
  }

  // Act if other node is leader
  async otherLeaderAction (currentLeader, nodeKey) {
    try {
      // Get leader metrics known
      const leaderMetrics = this.metrics.getMetrics(currentLeader);

      // If no metrics received we will wait noLivenessThreshold
      if (leaderMetrics === undefined) {
        // How much checks remains
        const checksNumber = this.noLivenessThreshold - this.noLivenessFromLeader;

        if (checksNumber > 0) {
          console.log('No liveness data from received from leader node...');
          console.log(`Will try to get leader place in ${checksNumber} checks...`);
          // Incrementing noLivenessFromLeader counter
          this.noLivenessFromLeader++;
          return false;
        // No metrics received for noLivenessThreshold times. Leader is offline.
        } else {
          console.log(`Can't check leader ${currentLeader} liveness for ${this.noLivenessThreshold} times. Trying to become new leader...`);
          this.noLivenessFromLeader = 0;
          const becomeLeaderResult = await this.becomeLeader(currentLeader);
          return becomeLeaderResult;
        }
      }

      const nowTime = new Date().getTime();
      const lastSeenAgo = nowTime - leaderMetrics.timestamp;

      // Checking if leader can be considered alive
      if (lastSeenAgo > this.aliveTime) {
        console.log(`Leader ${currentLeader} is down. Trying to become new leader...`);
        const becomeLeaderResult = await this.becomeLeader(currentLeader);
        return becomeLeaderResult;
      } else {
        console.log(`Leader ${currentLeader} is alive...`);
        return false;
      }
    } catch (error) {
      debug('otherLeaderAction', error);
      throw error;
    }
  }

  // Check isServiceReadyToStart
  async isServiceReadyToStart () {
    try {
      return await this.service.isServiceReadyToStart();
    } catch (error) {
      debug('isServiceReadyToStart', error);
      throw error;
    }
  };

  // Start service
  async serviceStart (mode) {
    try {
      await this.service.start(mode);
    } catch (error) {
      debug('serviceStart', error);
      throw error;
    }
  };

  // Cleanup a service
  async serviceCleanUp () {
    try {
      await this.service.cleanUp();
    } catch (error) {
      debug('serviceCleanUp', error);
      console.error(error);
    }
  }
}

module.exports = {
  Orchestrator
};
