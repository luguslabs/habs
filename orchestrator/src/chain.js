const { ApiPromise, WsProvider } = require('@polkadot/api');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/fixed');
const debug = require('debug')('chain');

const {
  getKeysFromSeed,
  fromModeToNodeStatus,
  transactionGetStatus
} = require('./utils');

class Chain {
  constructor (nodeWs, heartbeats, nodeGroup, mnemonic, heartbeatAddInterval, chainInfoUpdateInterval) {
    this.wsProvider = nodeWs;
    this.heartbeats = heartbeats;
    this.nodeGroup = nodeGroup;
    this.mnemonic = mnemonic;

    this.heartbeatAddInterval = heartbeatAddInterval;
    this.chainInfoUpdateInterval = chainInfoUpdateInterval;

    this.lastBlockAccumulator = 0;
    this.lastBlockThreshold = 10;

    this.finalizedGap = 10;

    this.currentLeaderValue = '';
    this.isLeadedGroupValue = false;
    this.canSendTransactionsValue = false;
    this.bestBlockNumber = 0;

    this.lastUpdateTime = parseInt(Date.now());

    this.heartbeatTimer = false;
    this.chainInfoTimer = false;
  }

  // Bootstrap chain
  async bootstrap (orchestrator) {
    // Connecting to chain
    await this.connect();

    // Fill heartbeats from chain
    await this.fillHeartbeatsFromChain();

    // Fill default chain data
    await this.update();

    // Create chain event listener
    this.listenEvents(this.mnemonic, orchestrator);

    // Add heartbeats every heartbeatAddInterval
    this.heartbeatTimer = setIntervalAsync(async () => {
      try {
        // Checking if heartbeats send is enabled
        console.log('Checking if heartbeats send is enabled...');
        if (!orchestrator.heartbeatSendEnabled || !orchestrator.heartbeatSendEnabledAdmin) {
          console.log('Heartbeat send is disabled...');
          return;
        }
        await this.addHeartbeat(orchestrator.getServiceMode(), this.mnemonic, this.nodeGroup);
      } catch (error) {
        console.error(error);
      }
    }, this.heartbeatAddInterval);

    // Updating chain info every chainInfoUpdateInterval
    this.chainInfoTimer = setIntervalAsync(async () => {
      try {
        console.log('Updating chain info...');
        await this.update();
      } catch (error) {
        console.error(error);
      }
    }, this.chainInfoUpdateInterval);

    console.log('Chain was successfully bootstrapped...');
  }

  // Connect to chain
  async connect () {
    // Creating Websocket Provider
    const provider = new WsProvider(this.wsProvider);

    // Creating API
    this.api = await ApiPromise.create({
      provider,
      types: {
        // mapping the actual specified address format
        Address: 'MultiAddress',
        // mapping the lookup
        LookupSource: 'MultiAddress'
      }
    });
    this.provider = provider;

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
      this.api.rpc.system.chain(),
      this.api.rpc.system.name(),
      this.api.rpc.system.version()
    ]);

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
  }

  // Update chain data
  async update() {
    // Fill current leader value
    this.currentLeaderValue = await this.getLeader();

    // Fill is leaded group
    this.isLeadedGroupValue = await this.isLeadedGroup();

    // Fill can send transaction value
    this.canSendTransactionsValue = await this.canSendTransactions();

    // Get block number and set last known block number
    this.bestBlockNumber = await this.getBestNumber();

    // Updating last update time
    this.lastUpdateTime = parseInt(Date.now());
  }

  // This function fills heartbeat values from chain for every wallet from node wallets
  async fillHeartbeatsFromChain () {
    const walletList = this.heartbeats.nodesWallets.toString().split(',');
    for (const wallet of walletList) {
      const heartbeatBlock = await this.getHeartbeat(wallet);
      this.heartbeats.addHeartbeat(wallet, 0, 0, heartbeatBlock);
    }
  }

  // Listen events
  async listenEvents (orchestrator) {
    const keys = await getKeysFromSeed(this.mnemonic);
    // Subscribe to events
    await this.api.query.system.events((events) => {
      // Loop through events
      events.forEach(({ event }) => {
        // If change leader event received
        if (event.section.toString() === 'archipelModule' && event.method.toString() === 'NewLeader') {
          debug('listenEvents', `Received new leader event from ${event.data[0].toString()}`);
          debug('listenEvents', JSON.stringify(event));
          // If anyone other took leadership
          if (event.data[0].toString() !== keys.address.toString() && event.data[1].toString() === this.nodeGroup.toString()) {
            // We will immediately update chain info and launch service in passive mode
            this.update();
            orchestrator.serviceStart('passive');
          }
        }
        // Add heartbeat if NewHeartbeat event was received
        if (event.section.toString() === 'archipelModule' && event.method.toString() === 'NewHeartbeat') {
          debug('listenEvents', `Received NewHeartbeat event from ${event.data[0].toString()}`);
          debug('listenEvents', JSON.stringify(event));
          this.heartbeats.addHeartbeat(event.data[0].toString(), event.data[1].toString(), event.data[2].toString(), event.data[3].toString());
        }
      });
    });
  }

  // Send heartbeat
  async addHeartbeat (mode) {
    // If node state permits to send transactions
    const sendTransaction = await this.canSendTransactions();
    // If node has any peers and is not in synchronizing chain
    if (sendTransaction) {
      debug('addHeartbeat', 'Archipel node has some peers and is synchronized so adding heartbeats...');
      // Get keys from mnemonic
      const keys = await getKeysFromSeed(this.mnemonic);
      // Get node status from mode
      const nodeStatus = await fromModeToNodeStatus(mode);
      // Get account nonce
      const accountNonce = await this.api.query.system.account(keys.address);
      const nonce = accountNonce.nonce;

      debug('addHeartbeat', `Nonce: ${nonce} groupId ${this.nodeGroup} mode ${mode} nodeStatus ${nodeStatus}`);

      // create, sign and send transaction
      return new Promise((resolve, reject) => {
        this.api.tx.archipelModule
        // Create transaction
          .addHeartbeat(this.nodeGroup, nodeStatus)
        // Sign transaction
          .sign(keys, { nonce })
        // Send transaction
          .send(({ events = [], status }) => {
          // Debug show transaction status
            debug('addHeartbeat', transactionGetStatus(status));
            debug('addHeartbeat', `Transaction status ${JSON.stringify(status)}`);
            if (status.isFinalized) {
              events.forEach(async ({ event: { data, method, section } }) => {
                if (section.toString() === 'archipelModule' && method.toString() === 'NewHeartbeat') {
                  // Show transaction data for Debug
                  debug('addHeartbeat', 'Transaction was successfully sent and generated an event.');
                  debug('addHeartbeat', `JSON Data: [${JSON.parse(data.toString())}]`);
                  resolve(true);
                }
              });
              resolve(false);
            }
            // If transaction is not ok resolving promise to false
            if (status.isDropped || status.isInvalid || status.isUsurped) {
              resolve(false);
            }
          }).catch(err => reject(err));
      });
    } else {
      console.log('Archipel node can\'t recieve transactions...');
      return false;
    }
  }

  // Set leader
  async setLeader (oldLeader) {
    // If node state permits to send transactions
    const sendTransaction = await this.canSendTransactions();
    // If node has any peers and is not in synchronizing chain
    if (sendTransaction) {
      // Get keys from mnemonic
      const keys = await getKeysFromSeed(this.mnemonic);

      // Get account nonce
      const accountNonce = await this.api.query.system.account(keys.address);
      const nonce = accountNonce.nonce;

      // Nonce show
      debug('setLeader', `Nonce: ${nonce}`);
      return new Promise((resolve, reject) => {
        // create, sign and send transaction
        this.api.tx.archipelModule
          // create transaction
          .setLeader(oldLeader, this.nodeGroup)
          // Sign and transaction
          .sign(keys, { nonce })
          // Send transaction
          .send(({ events = [], status }) => {
            // Debug show transaction status
            debug('setLeader', transactionGetStatus(status));
            debug('setLeader', `Transaction status ${JSON.stringify(status)}`);
            if (status.isFinalized) {
              events.forEach(async ({ event: { data, method, section } }) => {
                if (section.toString() === 'archipelModule' && method.toString() === 'NewLeader') {
                  // Show transaction data for Debug
                  debug('setLeader', 'Transaction was successfully sent and generated an event.');
                  debug('setLeader', `JSON Data: [${JSON.parse(data.toString())}]`);
                  // If transaction is successfull we will update chain info immediately
                  this.update();
                  resolve(true);
                }
              });
              resolve(false);
            }
            // If transaction is not ok resolving promise to false
            if (status.isDropped || status.isInvalid || status.isUsurped) {
              resolve(false);
            }
          }).catch(err => reject(err));
      });
    } else {
      console.log('Archipel node can\'t recieve transactions...');
      return false;
    }
  }

  // Give Up Leadership
  async giveUpLeadership () {
    // If node state permits to send transactions
    const sendTransaction = await this.canSendTransactions();
    // If node has any peers and is not in synchronizing chain
    if (sendTransaction) {
      // Get keys from mnemonic
      const keys = await getKeysFromSeed(this.mnemonic);

      // Get account nonce
      const accountNonce = await this.api.query.system.account(keys.address);
      const nonce = accountNonce.nonce;

      // Nonce show
      debug('giveUpLeadership', `Nonce: ${nonce}`);

      return new Promise((resolve, reject) => {
        // create, sign and send transaction
        this.api.tx.archipelModule
          // create transaction
          .giveUpLeadership(this.nodeGroup)
          // Sign and transaction
          .sign(keys, { nonce })
          // Send transaction
          .send(({ events = [], status }) => {
            // Debug show transaction status
            debug('giveUpLeadership', transactionGetStatus(status));
            debug('giveUpLeadership', `Transaction status ${JSON.stringify(status)}`);
            if (status.isFinalized) {
              events.forEach(async ({ event: { data, method, section } }) => {
                if (section.toString() === 'archipelModule' && method.toString() === 'GiveUpLeader') {
                  // Show transaction data for Debug
                  debug('giveUpLeadership', 'Transaction was successfully sent and generated an event.');
                  debug('giveUpLeadership', `JSON Data: [${JSON.parse(data.toString())}]`);
                  // If transaction is successfull we will update chain info immediately
                  this.update();
                  resolve(true);
                }
              });
              resolve(false);
            }
            // If transaction is not ok resolving promise to false
            if (status.isDropped || status.isInvalid || status.isUsurped) {
              resolve(false);
            }
          }).catch(err => reject(err));
      });
    } else {
      console.log('Archipel node can\'t recieve transactions...');
      return false;
    }
  }

  // Check if chain is moving forward is not wait for threshold and send false when theshold reached
  async chainMovingForward () {
    const currentBlock = await this.getBestNumber();
    // If chain is not moving forward we will incremnet the accumulator
    // If chain moved forward we will reset the accumulator
    this.lastBlockAccumulator = this.bestBlockNumber === currentBlock ? this.lastBlockAccumulator + 1 : 0;

    // If chain is not moving forward and accumulator reached the threshold the chain cannot recieve transactions
    if (this.bestBlockNumber === currentBlock && this.lastBlockAccumulator >= this.lastBlockThreshold) {
      debug('chainMovedForward', `The last block equal to current block ${this.bestBlockNumber}=${currentBlock}`);
      return false;
    }
    // Update last block number with current block number
    this.bestBlockNumber = currentBlock;
    return true;
  }

  // If node state permits to send transactions
  async canSendTransactions () {
    // Check if connected to chain
    if (!this.isConnected()) {
      debug('canSendTransactions', 'Node is not connected to archipel chain.');
      return false;
    }

    // Check if the chain is moving forward
    if (!await this.chainMovingForward()) {
      debug('canSendTransactions', 'The chain seems to not moving forward');
      return false;
    }

    // Check if gap between best block and best finalized block is not big
    const bestNumber = await this.getBestNumber();
    const bestNumberFinalized = await this.getBestNumberFinalized();
    if (bestNumber - bestNumberFinalized >= this.finalizedGap) {
      debug('canSendTransactions', `The gap between finalized and best block is very big (best bumber ${bestNumber} and best number finalized ${bestNumberFinalized}).`);
      return false;
    }

    // Get peers number
    let peersNumber = await this.getPeerNumber();
    debug('canSendTransactions', `Node has ${peersNumber} peers.`);

    // Get sync state
    let syncState = await this.getSyncState();
    debug('canSendTransactions', `Node is sync: ${syncState}`);

    // We will check for peers number and sync state twice with 5 second interval
    if (peersNumber === 0 || syncState === true) {
      console.log(`No peers (${peersNumber}) or wrong sync state (${syncState}). We will retry in 5 seconds...`);
      debug('canSendTransactions', `Peers number is ${peersNumber} and Sync State is ${syncState}. We will retry in 5 seconds.`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      peersNumber = await this.getPeerNumber();
      syncState = await this.getSyncState();
      debug('canSendTransactions', `After retry peers number is ${peersNumber} and Sync State is ${syncState}.`);
    }

    // If node has any peers and is not in synchronizing chain
    return peersNumber !== 0 && syncState !== true;
  }

  // Get current leader from Runtime
  async getLeader () {
    try {
      return (await this.api.query.archipelModule.leaders(this.nodeGroup)).toString();
    } catch (error) {
      debug('getLeader', error);
      return false;
    }
  }

  // Get leadedGroup status from Runtime
  async isLeadedGroup () {
    try {
      return (await this.api.query.archipelModule.leadedGroup(this.nodeGroup)).toString() === 'true';
    } catch (error) {
      debug('isLeadedGroup', error);
      return false;
    }
  }

  // Get heartbeat from Runtime
  async getHeartbeat (key) {
    try {
      return parseInt((await this.api.query.archipelModule.heartbeats(key)).toString());
    } catch (error) {
      debug('getHeartbeat', error);
      return 0;
    }
  }

  // Get Node Status from Runtime
  async getNodeStatus (key) {
    try {
      return parseInt((await this.api.query.archipelModule.nodesStatus(key)).toString());
    } catch (error) {
      debug('getNodeStatus', error);
      return 0;
    }
  }

  // Get Node Group from Runtime
  async getNodeGroup (key) {
    try {
      return parseInt((await this.api.query.archipelModule.groups(key)).toString());
    } catch (error) {
      debug('getNodeGroup', error);
      return 0;
    }
  }

  // Get bestNumber Chain
  async getBestNumber () {
    try {
      return parseInt((await this.api.derive.chain.bestNumber()).toString());
    } catch (error) {
      debug('getBestNumber', error);
      return 0;
    }
  }

  // Get bestNumberFinalized Chain
  async getBestNumberFinalized () {
    try {
      return parseInt((await this.api.derive.chain.bestNumberFinalized()).toString());
    } catch (error) {
      debug('getBestNumberFinalized', error);
      return 0;
    }
  }

  // Get peer number connected to Archipel node
  async getPeerNumber () {
    try {
      const health = await this.api.rpc.system.health();
      return parseInt(health.peers);
    } catch (error) {
      debug('getPeerNumber', error);
      return 0;
    }
  }

  // Get node sync state. Gives true if node is synching
  async getSyncState () {
    try {
      const health = await this.api.rpc.system.health();
      return health.isSyncing.toString() === 'true';
    } catch (error) {
      debug('getSyncState', error);
      return 0;
    }
  }

  // Get peer id from chain
  async getPeerId () {
    try {
      return (await this.api.rpc.system.localPeerId()).toString();
    } catch (error) {
      debug('getPeerId', error);
      return false;
    }
  }

  // Check if connected to node
  isConnected () {
    return this.provider.isConnected.toString() === 'true';
  }

  // Disconnect from chain
  async disconnect () {
    try {
      await this.api.disconnect();
      return true;
    } catch (error) {
      debug('disconnect', error);
      return false;
    }
  }

  // Shutdown chain
  async shutdown () {
    // Stopping heartbeat send
    if (this.heartbeatTimer) {
      await clearIntervalAsync(this.heartbeatTimer);
    }
    // Stopping chain info update
    if (this.chainInfoTimer) {
      await clearIntervalAsync(this.chainInfoTimer);
    }
    console.log('Waiting for 5 seconds to be sure that all intevals are finished...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Disconnecting from chain
    await this.disconnect();
  }
}

module.exports = {
  Chain
};
