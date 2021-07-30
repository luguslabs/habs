const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const { Service } = require('./service');

class Orchestrator {
  constructor (
    config,
    chain,
    heartbeats) {
    this.chain = chain;

    // Create service instance
    this.service = new Service(config.service);

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
    this.noReadyThreshold = 30;

    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;

    this.nodesWallets = config.nodesWallets;
  }

  // Bootstrap service at boot
  async bootstrapService () {
    console.log('Starting service in passive mode...');
    await this.service.serviceStart('passive');
  }

  // Orchestrate service
  async orchestrateService () {
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
      console.log('serviceMode is forced to passive. Start node in passive mode...');
      await this.service.serviceStart('passive');
      return;
    }

    // If service mode is active we will take the leadership and start service in active mode
    if (this.serviceMode === 'active') {
      console.log('serviceMode is forced to active. Trying to take leadership on chain...');
      const key = await getKeysFromSeed(this.mnemonic);
      const nodeKey = key.address;
      let currentLeader = await this.chain.getLeader(this.group);

      if (currentLeader.toString() === nodeKey) {
        console.log('Current node is leader so starting service in active mode...');
        await this.service.serviceStart('active');
        return;
      }

      // Trying to take leadership
      const isLeadedGroup = await this.chain.isLeadedGroup(this.group);
      currentLeader = isLeadedGroup ? currentLeader : nodeKey;
      const becomeLeaderResult = await this.becomeLeader(currentLeader);
      if (becomeLeaderResult) {
        console.log('Leadership was successfully taken so starting service in active mode...');
        await this.service.serviceStart('active');
        return;
      }
      console.log('Can\'t launch service in active mode cause the leadership on chain was not taken...');
      return;
    }
    throw Error('Wrong service mode ' + this.serviceMode + '...');
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
    const anyOneIsAlive = await this.anyOneAlive(nodeKey);
    if (!anyOneIsAlive) {
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

  // Manage leadership
  // Returns true if node is leader or was able to take leadership
  async leadershipManagement (nodeKey) {
    // Get current leader from chain
    const isLeadedGroup = await this.chain.isLeadedGroup(this.group);
    debug('orchestrateService', `Is Group ${this.group} a leaded group: ${isLeadedGroup}.`);

    // If the group is not leaded
    // First time Archipel boot
    if (isLeadedGroup === false) {
      console.log('Trying to take leadership...');
      return await this.becomeLeader(nodeKey);;
    }

    const currentLeader = (await this.chain.getLeader(this.group)).toString();
    // If this node is current leader
    if (currentLeader === nodeKey) {
      console.log('Current node is leader...');
      return true;
    }

    // Other node is leader
    debug('orchestrateService', `Current Leader is: ${currentLeader}`);
    console.log('Other node is leader...');
    return await this.otherLeaderAction(currentLeader);
  }

  // Take leader place
  async becomeLeader (nodeKey) {
    const setLeader = await this.chain.setLeader(nodeKey, this.group, this.mnemonic);
    if (setLeader) {
      console.log('The leadership was taken successfully...');
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
  }

  // Act if other node is leader
  async otherLeaderAction (currentLeader) {
    // Get learder hearbeat from chain
    const leaderHeartbeat = await this.chain.getHeartbeat(currentLeader);

    // If leader never sent a heartbeat
    // Possibly he will sent the heartbeat next
    if (leaderHeartbeat === 0) {
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
        return await this.becomeLeader(currentLeader);
      }
    }

    const bestNumber = await this.chain.getBestNumber();
    const lastSeenAgo = bestNumber - leaderHeartbeat;

    // Checking if leader can be considered alive
    if (lastSeenAgo > this.aliveTime) {
      console.log(
        `Leader ${currentLeader} is down. Trying to become new leader...`
      );
      return await this.becomeLeader(currentLeader);;
    } else {
      console.log(`Leader ${currentLeader} is alive...`);
      return false;
    }
  }

  // Service readiness management
  async serviceReadinessManagement () {
    const serviceReady = await this.service.serviceReady();

    // If service is not ready and current node is leader
    // We will wait some orchestrations 
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

  async anyOneAlive(nodeKey) {
    // Get block number from chain
    const bestNumber = await this.chain.getBestNumber();
    const nodesWallets = this.nodesWallets.split(',');
    for (const node of nodesWallets){
      // Excluding nodeKey
      if (nodeKey === node) continue;

      const heartbeat = await this.chain.getHeartbeat(node);
      console.log(`${node}: ${heartbeat}`);
      // If heartbeat is not set for this node
      if (heartbeat === 0) continue;

      // If heartbeat is set calculating if it is not very old
      if ((bestNumber - heartbeat) < this.aliveTime) return true;
    }
    // If no alive node found return false
    return false;
  }
}

module.exports = { Orchestrator };
