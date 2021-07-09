const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const Nexmo = require('nexmo');
const { Service } = require('./service');

class Orchestrator {
  constructor (
    chain,
    serviceName,
    heartbeats,
    mnemonic,
    aliveTime,
    archipelName,
    serviceMode,
    role,
    group,
    smsStonithActive,
    smsStonithActiveCallbackMandatory,
    smsStonithActiveCallbackMaxDelay,
    nexmoApiKey,
    nexmoApiSecret,
    nexmoApiSignatureMethod,
    nexmoApiSignatureSecret,
    nexmoApiCheckMsgSignature,
    nexmoPhoneNumber,
    outletPhoneNumberList,
    authoritiesList,
    archipelOrchestrationEnable
  ) {
    // No liveness data from leader count init
    this.noLivenessFromLeader = 0;
    this.noLivenessThreshold = 5;
    this.chain = chain;

    // Service not ready and node is in active mode
    this.noReadyCount = 0;
    this.noReadyThreshold = 30; // ~ 300 seconds

    // Check if orchestration if enabled or disabled
    this.orchestrationEnabled = !archipelOrchestrationEnable.includes('false');

    // Create service instance
    this.service = new Service(serviceName, this.chain, serviceMode);

    this.heartbeats = heartbeats;
    this.mnemonic = mnemonic;
    this.aliveTime = aliveTime;
    this.serviceMode = serviceMode;

    // ?????????????????????
    if (serviceMode === 'orchestrator') {
      this.service.mode = 'passive';
    }

    this.role = role;
    this.group = group;
    this.archipelName = archipelName;
    this.smsStonithActive = smsStonithActive;
    this.smsStonithActiveCallbackMandatory = smsStonithActiveCallbackMandatory;
    this.smsStonithActiveCallbackMaxDelay = smsStonithActiveCallbackMaxDelay;
    this.nexmoApiKey = nexmoApiKey.replace(/"/g, '');
    this.nexmoApiSecret = nexmoApiSecret.replace(/"/g, '');
    this.nexmoApiSignatureMethod = nexmoApiSignatureMethod.replace(/"/g, '');
    this.nexmoApiSignatureSecret = nexmoApiSignatureSecret.replace(/"/g, '');
    this.nexmoApiCheckMsgSignature = nexmoApiCheckMsgSignature;
    this.nexmoPhoneNumber = nexmoPhoneNumber.replace(/"/g, '');
    this.outletPhoneNumberList = outletPhoneNumberList.replace(/"/g, '');
    this.authoritiesList = authoritiesList;
    this.smsStonithCallbackStatus = 'none';
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
    const serviceReady = await this.service.serviceReadinessManagement();
    if (!serviceReady) {
      console.log("Service is not ready. Enforcing 'passive' service mode...");
      await this.service.serviceStart('passive');
      return;
    }

    // If heartbeats are disabled enforcing passive service mode
    if (!this.chain.heartbeatSendEnabled || !this.chain.heartbeatSendEnabledAdmin) {
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

  // SMS stonith algorithm
  async getOutletPhoneFromOldValidatorToShoot (currentLeaderKeyToShoot) {
    console.log(
      'currentLeaderKeyToShoot is [' + currentLeaderKeyToShoot + ']'
    );

    const outletPhoneNumberArray = this.outletPhoneNumberList.split(',');
    const authoritiesListArray = this.authoritiesList.split(',');
    if (parseInt(outletPhoneNumberArray.length) > parseInt(authoritiesListArray.length)) {
      console.log('this.outletPhoneNumberList is ' + this.outletPhoneNumberList);
      console.log('this.authoritiesList is ' + this.authoritiesList);
      console.log(
        'No Phone to call : wrong size be tween outletPhoneNumberArray and authoritiesListArray '
      );
      return 'null';
    }
    let indexToShoot = -1;

    for (var i = 0, len = authoritiesListArray.length; i < len; i++) {
      if (authoritiesListArray[i].trim() === currentLeaderKeyToShoot) {
        indexToShoot = i;
      }
    }

    if (
      indexToShoot !== -1 &&
      outletPhoneNumberArray[indexToShoot] !== 'null'
    ) {
      console.log(
        'phone number to shoot is :' + outletPhoneNumberArray[indexToShoot]
      );
      return outletPhoneNumberArray[indexToShoot];
    }
    console.log('no phone number to shoot not found or null');
    return 'null';
  }

  // SMS stonith algorithm
  async smsShootOldValidatorInTheHead (
    orchestratorAddress,
    currentLeaderKeyToShoot,
    isLeadedGroup
  ) {
    console.log('smsShootOldValidatorInTheHead start...');

    console.log('orchestratorAddress is:' + orchestratorAddress);
    console.log('currentLeaderKeyToShoot is:' + currentLeaderKeyToShoot);

    if (currentLeaderKeyToShoot.includes(orchestratorAddress)) {
      console.log('currentLeaderKeyToShoot is myself. Shoot aborted');
      return false;
    }

    if (!isLeadedGroup) {
      console.log(
        'isLeadedGroup is false. Shoot aborted'
      );
      return false;
    }

    if (
      currentLeaderKeyToShoot === undefined ||
      currentLeaderKeyToShoot === ''
    ) {
      console.log(
        'currentLeaderKeyToShoot is null or undefined. Shoot aborted'
      );
      return false;
    }

    if (this.nexmoApiKey === 'null') {
      console.log('nexmoApiKey is null. Shoot aborted');
      return false;
    }

    if (this.nexmoApiSecret === 'null') {
      console.log('nexmoApiSecret is null. Shoot aborted');
      return false;
    }

    if (this.nexmoPhoneNumber === 'null') {
      console.log('nexmoPhoneNumber is null. Shoot aborted');
      return false;
    }

    const outletNumberToShoot = await this.getOutletPhoneFromOldValidatorToShoot(
      currentLeaderKeyToShoot
    );
    if (outletNumberToShoot === 'null') {
      console.log('outletNumberToShoot is null. Shoot aborted');
      return false;
    }

    const nexmo = new Nexmo({
      apiKey: this.nexmoApiKey,
      apiSecret: this.nexmoApiSecret,
      signatureMethod: this.nexmoApiSignatureMethod,
      signatureSecret: this.nexmoApiSignatureSecret
    });

    const from = this.nexmoPhoneNumber;
    const to = outletNumberToShoot;
    const text = 'Restart';
    console.log(
      'shoot !!  from [' +
        this.nexmoPhoneNumber +
        '] to [' +
        outletNumberToShoot +
        '] action : [' +
        text +
        ']'
    );
    await nexmo.message.sendSms(from, to, text);
    console.log('smsShootOldValidatorInTheHead done...');
    return true;
  }

  async waitSmsCallBackShootConfirmation () {
    console.log('waitSmsCallBackShootConfirmation start');
    for (var i = 0, len = this.smsStonithActiveCallbackMaxDelay; i < len; i++) {
      if (this.smsStonithCallbackStatus === 'waitingCallBack') {
        console.log('waitSmsCallBackShootConfirmation : try again in 1 sec.' + i + '/' + this.smsStonithActiveCallbackMaxDelay);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }
    if (
      this.smsStonithCallbackStatus === 'waitingCallBack' ||
      this.smsStonithCallbackStatus === 'none'
    ) {
      console.log(
        'waitSmsCallBackShootConfirmation . sms not received after ' + this.smsStonithActiveCallbackMaxDelay + ' sec'
      );
      return false;
    } else {
      console.log(
        'waitSmsCallBackShootConfirmation . sms received !! smsStonithCallbackStatus is ' +
          this.smsStonithCallbackStatus
      );
      if (this.smsStonithCallbackStatus === 'Restarted') {
        console.log(
          'waitSmsCallBackShootConfirmation .  smsStonithCallbackStatus is Restarted. OK to become active');
        return true;
      } else {
        console.log(
          'waitSmsCallBackShootConfirmation .  smsStonithCallbackStatus is NOT Restarted. KO to become active');
        return false;
      }
    }
  }

  // Take leader place
  async becomeLeader (nodeKey) {
    try {
      const setLeader = await this.chain.setLeader(nodeKey, this.group, this.mnemonic);
      const isLeadedGroup = await this.chain.isLeadedGroup(this.group);
      if (setLeader) {
        console.log('The leadership was taken successfully...');
        console.log('smsStonith is Active = ' + this.smsStonithActive);

        if (this.smsStonithActive === 'true') {
          console.log('smsStonith is Active ');

          const getOrchestratorKey = await getKeysFromSeed(this.mnemonic);
          const orchestratorAddress = getOrchestratorKey.address;

          this.smsStonithCallbackStatus = 'waitingCallBack';
          const shoot = await this.smsShootOldValidatorInTheHead(
            orchestratorAddress,
            nodeKey,
            isLeadedGroup
          );
          if (shoot) {
            const callbackShootConfirmation = await this.waitSmsCallBackShootConfirmation();
            if (
              !callbackShootConfirmation &&
              this.smsStonithActiveCallbackMandatory === 'true'
            ) {
              console.log(
                'sms callback not received and is mandatory. Shutdown orchetrator to stay a passive node... '
              );
              this.orchestrationEnabled = false;
              // to allow other node to take leadership :
              this.chain.heartbeatSendEnabled = false;
              this.smsStonithCallbackStatus = 'none';
              return false;
            }
          } else {
            console.log('shoot aborted');
          }
          this.smsStonithCallbackStatus = 'none';
        } else {
          console.log('smsStonith is Off. ');
        }
        // We will wait 10 seconds to be sure that every Archipel node received leader update info
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

      debug('orchestrateService', `Is Group  ${this.group} a Leaded Group ? => ${isLeadedGroup} `);
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
}

module.exports = { Orchestrator };
