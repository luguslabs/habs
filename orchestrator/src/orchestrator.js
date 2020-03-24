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

  constructor (chain, service, metrics, mnemonic, aliveTime) {
    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;
    this.chain = chain;
    // Service not ready and node is in active mode
    this.noReadyCount = 0;
    this.noReadyThreshold = 30; // ~ 300 seconds
    // Create service instance
    this.service = Orchestrator.createServiceInstance(service);
    this.serviceName = service;
    this.metrics = metrics;
    this.mnemonic = mnemonic;
    this.aliveTime = aliveTime;
    this.orchestrationEnabled = true;
    this.mode = 'passive';
  }

  // Orchestrate service
  async orchestrateService () {
    try {
      console.log('Orchestrating service...');

      // Check if orchestration is enabled
      console.log('Checking if orchestration is enabled...');
      if (!this.orchestrationEnabled) {
        console.log('Orchestration is disabled...');
        return;
      }

      // If node state permits to send transactions
      console.log('Checking if Archipel chain node can receive transactions...');
      const sendTransaction = await this.chain.canSendTransactions();
      if (!sendTransaction) {
        console.log('Archipel chain node can\'t receive transactions. Enforcing \'passive\' service mode...');
        await this.serviceStart('passive');
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
        await this.serviceStart('passive');
        return;
      }

      // Check service readiness only if in passive mode
      console.log('Checking if service is ready to start...');
      const serviceReady = await this.serviceReadinessManagement();
      if (!serviceReady) {
        console.log('Service is not ready. Enforcing \'passive\' service mode...');
        await this.serviceStart('passive');
        return;
      }

      // Check node leadership
      console.log('Checking node leadership...');
      const leadership = await this.leadershipManagement(nodeKey);

      if (!leadership) {
        console.log('The current node is not leader. Enforcing \'passive\' service mode...');
        await this.serviceStart('passive');
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
        // We will wait 10 seconds to be sure that every Archipel node received leader update info
        console.log('Waiting 10 seconds to be sure that every node received leader update...');
        await new Promise(resolve => setTimeout(resolve, 10000));
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

  // Service readiness management
  async serviceReadinessManagement () {
    const serviceReady = await this.isServiceReadyToStart(this.mode);

    // If service is not ready and current node is leader
    if (!serviceReady && this.mode === 'active') {
      // Waiting for this.noReadyThreshold orchestrations
      if (this.noReadyCount < this.noReadyThreshold) {
        console.log(`Service is not ready but current node is leader. Waiting for ${this.noReadyThreshold - this.noReadyCount} orchestrations...`);
        this.noReadyCount++;
        return true;
      // If service is not ready after noReadyThreshold enforcing passive mode
      // And disabling metrics send
      } else {
        console.log(`Service is not ready for ${this.noReadyThreshold} orchestrations. Disabling metrics send and enforcing passive mode...`);
        this.chain.metricSendEnabled = false;
        return false;
      }
    }

    // Reset noReady counter
    if (this.noReadyCount !== 0) {
      this.noReadyCount = 0;
    }

    // Return isServiceReadyToStart result
    return serviceReady;
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

      const otherLeaderActionResult = await this.otherLeaderAction(currentLeader);
      return otherLeaderActionResult;
    } catch (error) {
      debug('leadershipManagement', error);
      throw error;
    }
  }

  // Act if other node is leader
  async otherLeaderAction (currentLeader) {
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
  async isServiceReadyToStart (mode) {
    try {
      return await this.service.isServiceReadyToStart(mode);
    } catch (error) {
      debug('isServiceReadyToStart', error);
      throw error;
    }
  };

  // Start service
  async serviceStart (mode) {
    try {
      await this.service.start(mode);
      this.mode = mode;
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

  // Get Orchestrator address
  async getOrchestratorAddress () {
    const key = await getKeysFromSeed(this.mnemonic);
    return key.address;
  }
}

module.exports = {
  Orchestrator
};
