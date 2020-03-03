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
    // Create service instance
    this.service = Orchestrator.createServiceInstance(service);
    this.metrics = metrics;
    this.mnemonic = mnemonic;
    this.aliveTime = aliveTime;
  }

  // Orchestrate service
  async orchestrateService () {
    try {
      console.log('Orchestrating service.....');

      // If node state permits to send transactions
      const sendTransaction = await this.chain.canSendTransactions();

      if (sendTransaction) {
        console.log('Archipel node has some peers and is synchronized so orchestrating...');
        // Get node address from seed
        const key = await getKeysFromSeed(this.mnemonic);
        const nodeKey = key.address;
        debug('orchestrateService', `Current Node Key: ${nodeKey}`);

        // Get current leader from chain
        let currentLeader = await this.chain.getLeader();
        currentLeader = currentLeader.toString();

        // If current leader is already set
        if (currentLeader !== '') {
          debug('orchestrateService', `Current Leader: ${currentLeader}`);
          // If you are the current leader
          if (currentLeader === nodeKey) {
            console.log('Current node is leader.');
            await this.serviceStartIfAnyoneActive(nodeKey);
          // If someone else is leader
          } else {
            await this.otherLeaderAction(currentLeader, nodeKey);
          }
        // Leader is not already set (first time boot)
        } else {
          console.log('There is no leader set...');
          await this.becomeLeader(nodeKey, nodeKey);
        }
      } else {
        console.log('Archipel node can\'t receive transactions...');
      }
    } catch (error) {
      debug('orchestrateService', error);
      console.error(error);
    }
  };

  // Act if other node is leader
  async otherLeaderAction (currentLeader, nodeKey) {
    try {
      // Get leader metrics known
      const leaderMetrics = this.metrics.getMetrics(currentLeader);

      // If leader already sent an Metrics Update
      if (leaderMetrics !== undefined) {
        const nowTime = new Date().getTime();
        const lastSeenAgo = nowTime - leaderMetrics.timestamp;

        // Checking if leader can be considered alive
        if (lastSeenAgo > this.aliveTime) {
          await this.becomeLeader(currentLeader, nodeKey);
        } else {
          console.log(`Leader ${currentLeader} is alive no action required...`);
          console.log('Enforcing passive mode...');
          await this.serviceStart('passive');
        }

      // If there is no metrics received from leader node
      } else {
        // How much checks remains
        const checksNumber = this.noLivenessThreshold - this.noLivenessFromLeader;

        if (checksNumber > 0) {
          console.log('No liveness data from received from leader node...');
          console.log(`Will try to get leader place in ${checksNumber} checks...`);
          // Incrementing noLivenessFromLeader counter
          this.noLivenessFromLeader++;

        // No metrics received for noLivenessThreshold times. Leader is offline.
        } else {
          console.log(`Can't check leader liveness for ${this.noLivenessThreshold} times.`);
          await this.becomeLeader(currentLeader, nodeKey);
        }
      }
    } catch (error) {
      debug('otherLeaderAction', error);
      throw error;
    }
  };

  // Set leader on chain and launch service
  async becomeLeader (oldLeaderKey, nodeKey) {
    try {
      console.log('Before trying to become leader, check if service is ready and safe to become leader...');
      const isServiceReadyToStart = await this.isServiceReadyToStart();
      if (isServiceReadyToStart) {
        console.log('Trying to become leader...');
        const leaderSet = await this.chain.setLeader(oldLeaderKey, this.mnemonic);
        if (leaderSet === true) {
          console.log('The leader set transaction was completed...');
          console.log('Sleeping 5 seconds to be sure that transaction was propagated to every node...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          await this.serviceStartIfAnyoneActive(nodeKey);
        } else {
          console.log('Can\'t set leader.');
          console.log('Transaction failed or someone already took the leader place...');
        }
      } else {
        console.log('Service not ready... DO NOT try to become leader...');
      }
    } catch (error) {
      debug('becomeLeader', error);
      throw error;
    }
  };

  // Start active service is there is anyone online
  async serviceStartIfAnyoneActive (nodeKey) {
    try {
      // The node is not isolated launching service in active mode
      if (this.metrics.anyOneAlive(nodeKey, this.aliveTime)) {
        console.log('Found someone online...');
        console.log('Launching active node...');
        await this.serviceStart('active');
      // The node is isolated launching service in passive mode
      } else {
        console.log('Seems that no one is online...');
        console.log('Launching passive node...');
        await this.serviceStart('passive');
      }
    } catch (error) {
      debug('currentLeader', error);
      throw error;
    }
  };

  // Check isServiceReadyToStart
  async isServiceReadyToStart () {
    try {
      return await this.service.isServiceReadyToStart();
    } catch (error) {
      debug('isServiceReadyToStart', error);
      throw error;
    }
  };

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
  };
}

module.exports = {
  Orchestrator
};
