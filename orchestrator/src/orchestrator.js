const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const { Service } = require('./service');
const { Stonith } = require('./stonith');

class Orchestrator {
  constructor (
    config,
    chain,
    heartbeats) {
    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;
    this.chain = chain;

    this.stonith = new Stonith(this);
    // Create service instance
    this.service = new Service(config.service, config.serviceMode);

    this.heartbeats = heartbeats;
    this.aliveTime = config.aliveTime;
    this.serviceMode = config.serviceMode;

    this.mnemonic = config.mnemonic;

    this.group = config.nodeGroupId;
    this.archipelName = config.archipelName;
    this.orchestrationEnabled = config.orchestrationEnabled;

    this.heartbeatSendEnabled = true;
    this.heartbeatSendEnabledAdmin = config.heartbeatEnabled;

    // Service not ready and node is in active mode
    this.noReadyCount = 0;
    this.noReadyThreshold = 30; // ~ 300 seconds
  }

  // Bootstrap service at boot
  async bootstrapService () {
    // Start service before orchestration
    if (this.serviceMode === 'orchestrator' || this.serviceMode === 'passive') {
      console.log(`Archipel service mode is ${this.serviceMode}. Starting service in passive...`);
      await this.service.serviceStart('passive');
    } else if (this.serviceMode === 'active') {
      console.log('Archipel service mode is force as active mode...');
      await this.service.serviceStart('active');
    } else {
      throw Error('Unkown archipel service mode. Shutting down...');
    }
  }

  // Orchestrate service
  async orchestrateService () {
    try {
      console.log('Orchestrating service...');

      // Check if orchestration is enabled
      if (!this.orchestrationEnabled) {
        console.log('Orchestration is disabled...');
        return;
      }

      // If service mode is orchestrator we will do the classic orchestration
      if (this.serviceMode === 'orchestrator') {
        console.log('serviceMode is orchestrator. So orchestrating...');
        await this.orchestrateOperatorService();
        return;
      }

      // If service mode is passive we will start the service in passive mode
      if (this.serviceMode === 'passive') {
        console.log('serviceMode force to passive. Start node in passive mode...');
        await this.service.serviceStart('passive');
        return;
      }

      // If service mode is active we will start the service in active mode
      if (this.serviceMode === 'active') {
        console.log('serviceMode force to active. Start node in active mode...');
        await this.service.serviceStart('active');
        return;
      }

      console.log('Wrong service mode ' + this.serviceMode + '. Do nothing...');
      return;
    } catch (error) {
      debug('orchestrateService', error);
      throw error;
    }
  }

  // This method contains main orchestration logic
  async orchestrateOperatorService () {
    // If node state permits to send transactions
    console.log('Checking if Archipel chain node can receive transactions...');
    const sendTransaction = await this.chain.canSendTransactions();
    if (!sendTransaction) {
      console.log(
        "Archipel chain node can't receive transactions. Enforcing 'passive' service mode..."
      );
      await this.service.serviceStart('passive');
      return;
    }

    // Get node address from seed
    const key = await getKeysFromSeed(this.mnemonic);
    const nodeKey = key.address;
    debug('orchestrateService', `Current Node Key: ${nodeKey}`);

    // Get current best block number
    const bestNumber = await this.chain.getBestNumber();
    debug('orchestrateService', `bestNumber: ${bestNumber}`);

    // Check if anyone is alive
    console.log('Checking is anyone in federation is alive...');
    if (!this.heartbeats.anyOneAlive(nodeKey, this.aliveTime, this.group, bestNumber)) {
      console.log(
        "Seems that no one is alive. Enforcing 'passive' service mode..."
      );
      await this.service.serviceStart('passive');
      return;
    }

    // Check if service is ready to be started if not enforcing passive service mode
    console.log('Checking if service is ready to start...');
    const serviceReady = await this.serviceReadinessManagement();
    if (!serviceReady) {
      console.log("Service is not ready. Enforcing 'passive' service mode...");
      await this.service.serviceStart('passive');
      return;
    }

    // If heartbeats are disabled enforcing passive service mode
    if (!this.heartbeatSendEnabled || !this.heartbeatSendEnabledAdmin) {
      console.log('Heartbeat send is disabled. Enforcing passive service mode...');
      await this.service.serviceStart('passive');
      return;
    }

    // Manage the node leadership and if not leader enforcing passive service mode
    console.log('Checking node leadership...');
    const leadership = await this.leadershipManagement(nodeKey);
    if (!leadership) {
      console.log(
        "The current node is not leader. Enforcing 'passive' service mode..."
      );
      await this.service.serviceStart('passive');
      return;
    }

    // If all checks passed we can start service in active mode
    console.log('All checks passed. Launching service in active mode...');
    await this.service.serviceStart('active');
  }

  // Take leader place
  async becomeLeader (nodeKey) {
    try {
      const setLeader = await this.chain.setLeader(nodeKey, this.group, this.mnemonic);
      if (setLeader) {
        console.log('The leadership was taken successfully...');

        // If stonith is active shutdown other validator
        // If not just return true and continue
        const stonithResult = await this.stonith.shootOldValidator(nodeKey);
        if (!stonithResult) {
          console.log('Stonith was not successfull. Will retry the next time...');
          return false;
        }

        console.log(
          'Waiting 10 seconds to be sure that every node received leader update...'
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));

        return true;
      } else {
        console.log(
          'Failed to take leadership. Possibly other node already took leadership...'
        );
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
      let currentLeader = await this.chain.getLeader(this.group);
      const isLeadedGroup = await this.chain.isLeadedGroup(this.group);

      debug('orchestrateService', `Is Group ${this.group} a leaded group: ${isLeadedGroup}.`);
      currentLeader = currentLeader.toString();

      // If current leader is empty
      // First time Archipel boot
      if (isLeadedGroup === false) {
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

      const otherLeaderActionResult = await this.otherLeaderAction(
        currentLeader
      );
      return otherLeaderActionResult;
    } catch (error) {
      debug('leadershipManagement', error);
      throw error;
    }
  }

  // Act if other node is leader
  async otherLeaderAction (currentLeader) {
    try {
      // Get leader heartbeats known
      const leaderHeartbeat = this.heartbeats.getHeartbeat(currentLeader);

      // If no heartbeat received we will wait noLivenessThreshold
      if (leaderHeartbeat === undefined) {
        // How much checks remains
        const checksNumber =
          this.noLivenessThreshold - this.noLivenessFromLeader;

        if (checksNumber > 0) {
          console.log('No liveness data from received from leader node...');
          console.log(
            `Will try to get leader place in ${checksNumber} checks...`
          );
          // Incrementing noLivenessFromLeader counter
          this.noLivenessFromLeader++;
          return false;
          // No leaderHeart received for noLivenessThreshold times. Leader is offline.
        } else {
          console.log(
            `Can't check leader ${currentLeader} liveness for ${this.noLivenessThreshold} times. Trying to become new leader...`
          );
          this.noLivenessFromLeader = 0;
          const becomeLeaderResult = await this.becomeLeader(currentLeader);
          return becomeLeaderResult;
        }
      }

      const bestNumber = await this.chain.getBestNumber();
      debug('orchestrateService', `bestNumber: ${bestNumber}`);
      const lastSeenAgo = bestNumber - leaderHeartbeat.blockNumber;

      // Checking if leader can be considered alive
      if (lastSeenAgo > this.aliveTime) {
        console.log(
          `Leader ${currentLeader} is down. Trying to become new leader...`
        );
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

  // Service readiness management
  async serviceReadinessManagement () {
    const serviceReady = await this.service.serviceReady();

    // If service is not ready and current node is leader
    if (!serviceReady && this.service.mode === 'active') {
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
        this.heartbeatSendEnabled = false;
        return false;
      }
    }

    // If service is ready and heartbeat send is disabled we can activate heartbeats send
    if (serviceReady && !this.heartbeatSendEnabled) {
      console.log(
        'Service is ready and heartbeat send was disabled. Enabling it...'
      );
      this.heartbeatSendEnabled = true;
    }

    // Reset noReady counter
    if (this.noReadyCount !== 0) {
      this.noReadyCount = 0;
    }

    // Return isServiceReadyToStart result
    return serviceReady;
  }
}

module.exports = { Orchestrator };
