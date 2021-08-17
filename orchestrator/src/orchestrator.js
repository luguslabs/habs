const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const { Service } = require('./service');

class Orchestrator {
  constructor (
    config,
    chain,
    heartbeats) {
    this.nodeRole = config.nodeRole;

    // Create service instance if node role is not no service
    if (this.nodeRole !== 'noservice') {
      this.service = new Service(config.service);
      this.serviceMode = config.serviceMode;
    }

    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;
    this.chain = chain;

    this.heartbeats = heartbeats;
    this.aliveTime = config.aliveTime;

    this.mnemonic = config.mnemonic;

    this.group = config.nodeGroupId;
    this.archipelName = config.archipelName;
    this.orchestrationEnabled = config.orchestrationEnabled;

    this.heartbeatSendEnabled = true;
    this.heartbeatSendEnabledAdmin = config.heartbeatEnabled;

    // If service is not ready and is in active node counters
    this.noReadyCount = 0;
    this.noReadyThreshold = 30; // ~ 300 seconds

    this.nodesWallets = config.nodesWallets;
  }

  // Bootstrap service at boot
  async bootstrapOrchestrator () {
    // If node is a no service node there is nothing to bootstrap
    if (this.nodeRole === 'noservice') {
      console.log('Nothing to bootstrap cause no service node...');
      return;
    }
    // Starting service in default passive mode
    console.log('Starting service in passive mode...');
    const serviceStart = await this.serviceStart('passive');
    if (!serviceStart) {
      throw Error('Unable to start service in passive mode. Please check your configuration and docker daemon.');
    }

    // Fill heartbeats from chain at orchestrator start
    const walletList = this.nodesWallets.toString().split(',');
    for (const wallet of walletList) {
      const heartbeatBlock = await this.chain.getHeartbeat(wallet);
      this.heartbeats.addHeartbeat(wallet, 0, 0, heartbeatBlock.toString());
    }
  }

  // If active service mode is forced somewhere we will take leadership on chain and launch service in active mode
  async forceActive () {
    // If node is no service node there is nothing to activate
    if (this.nodeRole === 'noservice') {
      console.log('Nothing to activate cause no service node...');
      return false;
    }

    console.log('Checking leadership on chain...');
    const key = await getKeysFromSeed(this.mnemonic);
    const nodeKey = key.address;
    let currentLeader = await this.chain.getLeader(this.group);

    // If node is already leader on chain
    if (currentLeader.toString() === nodeKey) {
      console.log('Current node is leader so starting service in active mode...');
      await this.serviceStart('active');
      return true;
    }

    // Trying to take leadership
    console.log('Taking leadership...');
    const isLeadedGroup = await this.chain.isLeadedGroup(this.group);
    currentLeader = isLeadedGroup ? currentLeader : nodeKey;
    const becomeLeaderResult = await this.becomeLeader(currentLeader);
    if (becomeLeaderResult) {
      console.log('Leadership was taken successfully...');
      // Checking current leader and starting in active mode
      currentLeader = await this.chain.getLeader(this.group);
      if (currentLeader.toString() === nodeKey) {
        await this.serviceStart('active');
        return true;
      }
    }
    console.log('Can\'t launch service in active mode cause the leadership on chain was not taken...');
    return false;
  }

  // Orchestrate service
  async orchestrateService () {
    console.log('Orchestrating service...');

    // If node is no service node there is nothing to orchestrate
    if (this.nodeRole === 'noservice') {
      console.log('Nothing to orchestrate cause no service node...');
      return;
    }

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
      await this.serviceStart('passive');
      return;
    }

    // If service mode is active we will take the leadership and start service in active mode
    if (this.serviceMode === 'active') {
      console.log('serviceMode is forced to active...');
      await this.forceActive();
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
      await this.serviceStart('passive');
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
      await this.serviceStart('passive');
      return;
    }

    // Check if service is ready to be started if not enforcing passive service mode
    console.log('Checking if service is ready to start...');
    const serviceReady = await this.serviceReadinessManagement();
    if (!serviceReady) {
      console.log("Service is not ready. Enforcing 'passive' service mode...");
      await this.serviceStart('passive');
      return;
    }

    // If heartbeats are disabled enforcing passive service mode
    if (!this.heartbeatSendEnabled || !this.heartbeatSendEnabledAdmin) {
      console.log('Heartbeat send is disabled. Enforcing passive service mode...');
      await this.serviceStart('passive');
      return;
    }

    // Manage the node leadership and if not leader enforcing passive service mode
    console.log('Checking node leadership...');
    const leadership = await this.leadershipManagement(nodeKey);
    if (!leadership) {
      console.log(
        "The current node is not leader. Enforcing 'passive' service mode..."
      );
      await this.serviceStart('passive');
      return;
    }

    // We will recheck if after all checks the current node is leader
    // If so we will launch service in active mode
    const currentLeader = await this.chain.getLeader(this.group);

    if (currentLeader.toString() === nodeKey) {
      console.log('All checks passed and current node is leader. Launching service in active mode...');
      await this.serviceStart('active');
    }
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

  // Manage leadership
  // Returns true if node is leader or was able to take leadership
  async leadershipManagement (nodeKey) {
    // Get current leader from chain
    let currentLeader = await this.chain.getLeader(this.group);
    const isLeadedGroup = await this.chain.isLeadedGroup(this.group);

    debug('orchestrateService', `Is Group ${this.group} a leaded group: ${isLeadedGroup}.`);
    currentLeader = currentLeader.toString();

    // If current leader is empty
    // First time Archipel boot
    if (isLeadedGroup === false) {
      console.log('Trying to take leadership...');
      return await this.becomeLeader(nodeKey);
    }

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

  // Act if other node is leader
  async otherLeaderAction (currentLeader) {
    // Get leader heartbeats known
    const leaderHeartbeat = this.heartbeats.getHeartbeat(currentLeader);

    // If no heartbeat received we will wait noLivenessThreshold
    if (leaderHeartbeat) {
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
    debug('orchestrateService', `bestNumber: ${bestNumber}`);
    const lastSeenAgo = bestNumber - leaderHeartbeat.blockNumber;

    // Checking if leader can be considered alive
    if (lastSeenAgo > this.aliveTime) {
      console.log(
        `Leader ${currentLeader} is down. Trying to become new leader...`
      );
      return await this.becomeLeader(currentLeader);
    } else {
      console.log(`Leader ${currentLeader} is alive...`);
      return false;
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
    this.noReadyCount = 0;

    // Return isServiceReadyToStart result
    return serviceReady;
  }

  // Service cleanup
  async serviceCleanUp () {
    // If node is no service node there is nothing to cleanup
    if (this.nodeRole === 'noservice') {
      console.log('Nothing to cleanup cause no service node...');
      return false;
    }
    return await this.service.serviceCleanUp();
  }

  // Service start
  async serviceStart (mode) {
    // If node is no service node there is nothing to start
    if (this.nodeRole === 'noservice') {
      console.log('Nothing to start cause no service node...');
      return false;
    }
    return await this.service.serviceStart(mode);
  }

  // Get service mode
  getServiceMode () {
    // If node is no service node we will return node service for service mode
    if (this.nodeRole === 'noservice') {
      return 'noservice';
    }
    return this.service.mode;
  }

  // Get orchestrator info and stats
  async getOrchestratorInfo () {
    // Constructing orchestrator info
    const orchestratorInfo = {
      orchestratorAddress: (await getKeysFromSeed(this.mnemonic)).address,
      archipelName: this.archipelName,
      isConnected: this.chain.isConnected(),
      peerId: await this.chain.getPeerId(),
      peerNumber: await this.chain.getPeerNumber(),
      bestNumber: await this.chain.getBestNumber(),
      synchState: await this.chain.getSyncState(),
      leader: await this.chain.getLeader(this.group),
      orchestrationEnabled: this.orchestrationEnabled,
      heartbeatSendEnabledAdmin: this.heartbeatSendEnabledAdmin,
      heartbeatSendEnabled: this.heartbeatSendEnabled,
      heartbeats: this.heartbeats.getAllHeartbeats()
    };

    // If no service role just returning basic orchestrator info
    if (this.nodeRole === 'noservice') {
      return orchestratorInfo;
    }

    // If not adding service info
    return {
      ...orchestratorInfo,
      ...await this.service.getServiceInfo()
    };
  }
}

module.exports = { Orchestrator };
