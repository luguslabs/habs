const debug = require('debug')('service');

const { getKeysFromSeed } = require('./utils');
const { Polkadot } = require('./polkadot');
const { Docker } = require('./docker');
const Nexmo = require('nexmo');
const { DownloaderHelper } = require('node-downloader-helper');
const jaguar = require('jaguar');
const fsExtra = require('fs-extra');

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

  constructor (
    chain,
    service,
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
    authoritiesList
  ) {
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
    this.heartbeats = heartbeats;
    this.mnemonic = mnemonic;
    this.aliveTime = aliveTime;
    this.orchestrationEnabled = true;
    this.serviceMode = serviceMode;
    this.mode = serviceMode;
    if (serviceMode === 'orchestrator') {
      this.mode = (role === 'operator') ? 'passive' : 'sentry';
    }
    this.role = role;
    this.group = group;
    this.archipelName = archipelName;
    this.smsStonithActive = smsStonithActive;
    this.smsStonithActiveCallbackMandatory = smsStonithActiveCallbackMandatory;
    this.smsStonithActiveCallbackMaxDelay = smsStonithActiveCallbackMaxDelay;
    this.nexmoApiKey = nexmoApiKey;
    this.nexmoApiSecret = nexmoApiSecret;
    this.nexmoApiSignatureMethod = nexmoApiSignatureMethod;
    this.nexmoApiSignatureSecret = nexmoApiSignatureSecret;
    this.nexmoApiCheckMsgSignature = nexmoApiCheckMsgSignature;
    this.nexmoPhoneNumber = nexmoPhoneNumber;
    this.outletPhoneNumberList = outletPhoneNumberList;
    this.authoritiesList = authoritiesList;
    this.smsStonithCallbackStatus = 'none';
    this.downloadRunning = false;
    this.downloadPaused = false;
    this.download = false;
    this.downloadSuccess = false;
    this.downloadError = '';
    this.downloadState = 'NONE';
    this.databaseRestoreRunning = false;
    this.databaseRestoreSuccess = false;
    this.databaseRestoreError = '';
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
      if (this.serviceMode === 'orchestrator') {
        if (this.role === 'operator') {
          console.log('Start node in operator mode, active or passive...');
          await this.orchestrateOperatorService();
        } else {
          console.log('Start node in sentry mode...');
          await this.serviceStart('sentry');
        }
      } else if (this.serviceMode === 'sentry') {
        console.log('serviceMode force to sentry. Start node in sentry mode...');
        await this.serviceStart('sentry');
      } else if (this.serviceMode === 'passive') {
        console.log('serviceMode force to passive. Start node in passive mode...');
        await this.serviceStart('passive');
      } else if (this.serviceMode === 'active') {
        console.log('serviceMode force to active. Start node in active mode...');
        await this.serviceStart('active');
      } else {
        console.log('Wrong service mode ' + this.serviceMode + '. Do nothing...');
        return;
      }
    } catch (error) {
      debug('orchestrateService', error);
      throw error;
    }
  }

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

    // Check if anyone is alive
    console.log('Checking is anyone in federation is alive...');

    const bestNumber = await this.chain.getBestNumber();
    debug('orchestrateService', `bestNumber: ${bestNumber}`);

    if (!this.heartbeats.anyOneAlive(nodeKey, this.aliveTime, this.group, bestNumber)) {
      console.log(
        "Seems that no one is alive. Enforcing 'passive' service mode..."
      );
      await this.serviceStart('passive');
      return;
    }

    // Check service readiness only if in passive mode
    console.log('Checking if service is ready to start...');
    const serviceReady = await this.serviceReadinessManagement();
    if (!serviceReady) {
      console.log("Service is not ready. Enforcing 'passive' service mode...");
      await this.serviceStart('passive');
      return;
    }

    // If heartbeats are disabled enforcing passive service mode
    if (!this.chain.heartbeatSendEnabled || !this.chain.heartbeatSendEnabledAdmin) {
      console.log('Heartbeat send is disabled. Enforcing passive service mode...');
      await this.serviceStart('passive');
      return;
    }

    // Check node leadership
    console.log('Checking node leadership...');
    const leadership = await this.leadershipManagement(nodeKey);

    if (!leadership) {
      console.log(
        "The current node is not leader. Enforcing 'passive' service mode..."
      );
      await this.serviceStart('passive');
      return;
    }

    // If all checks passed we can start service in active mode
    console.log('All checks passed. Launching service in active mode...');
    await this.serviceStart('active');
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
          const orchestratorAddress = await this.getOrchestratorAddress();
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

  // Service readiness management
  async serviceReadinessManagement () {
    const serviceReady = await this.isServiceReadyToStart(this.mode);

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
          `Service is not ready for ${this.noReadyThreshold} orchestrations. Disabling heartbeat send and enforcing passive mode...`
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

  // Check isServiceReadyToStart
  async isServiceReadyToStart (mode) {
    try {
      return await this.service.isServiceReadyToStart(mode);
    } catch (error) {
      debug('isServiceReadyToStart', error);
      throw error;
    }
  }

  // Start service
  async serviceStart (mode) {
    try {
      await this.service.start(mode);
      this.mode = mode;
    } catch (error) {
      debug('serviceStart', error);
      throw error;
    }
  }

  // Restore Service Database
  async serviceRestoreDB(action) {
    try {
      const backupURL = this.service.getBackupURL();

      // Create download object if is not already created
      if (!this.download) {
        this.download = new DownloaderHelper(backupURL, '/', {override: true, retry: {maxRetries: 5, delay: 5000}});
      }

      // Download events
      this.download.on('error', (error) => { 
        const errorMsg = `Download Error! Error: ${error}.`;
        console.log(errorMsg);
        this.downloadError = errorMsg;
        this.downloadRunning = false;
      });

      this.download.on('timeout', () => {
        const errorMsg = `Download Error! Timeout!`;
        console.log(errorMsg);
        this.downloadError = errorMsg;
        this.downloadRunning = false;
      });

      this.download.on('retry', (attempt, retryOpts) => {
        const errorMsg = `Download Error! Retry #${attempt}/${retryOpts.maxAttempts}. Delay ${retryOpts.delay} ms.`;
        console.log(errorMsg);
        this.downloadError = errorMsg;
      });

      this.download.on('stateChanged', (state) => {
        console.log(`Download State Changed! State: ${state}.`);
        this.downloadState = state;
      });

      // Download success handler
      this.download.on('end', (downloadInfo) => {
        if (!downloadInfo.incomplete) {
          const backupURL = this.service.getBackupURL();
          const fileName = backupURL.split('/').pop();

          if (this.downloadRunning){
            this.downloadSuccess = true;
            console.log(`File was successfully downloaded and saved to /${fileName}...`);
            this.downloadRunning = false;
          }
        } else {
          console.log(`Download was finished but is incomplete.`)
        }
        this.downloadError = '';
      });

      // Info about action
      let info = '';

      // Starting download
      if (action == 'download-start') {
        // If download if not already running starting it
        if(!this.downloadRunning) {
          console.log(`Starting download from ${backupURL}...`);
          this.download.start();
          this.downloadSuccess = false;
          this.downloadRunning = true;
          this.downloadPause = false;
          info = 'Download was started!'
          console.log(info);
        } else {
          info = 'Download is already running!'
          console.log(info);
        }
        return info;
      // Stopping download
      } else if (action == 'download-stop') {
        if(this.downloadRunning) {
          console.log('Stopping the download...');
          await this.download.stop();
          this.downloadRunning = false;
          this.downloadPaused = false;
          info = 'Download was stopped!'
          console.log(info);
        } else {
          info = 'Download is not running!';
          console.log(info);
        }
        return info;
      // Pausing download
      } else if (action == 'download-pause') {
        if(this.downloadRunning && !this.downloadPaused){
          console.log('Pausing the download...');
          await this.download.pause();
          this.downloadPaused = true;
          info = 'Download was paused!'
          console.log(info);
        } else {
          info = 'Download is not running or already paused!';
          console.log(info);
        }
        return info;
      // Resuming download
      } else if (action == 'download-resume') {
        if(this.downloadRunning && this.downloadPaused){
          console.log('Resuming the download...');
          this.downloadPaused = false;
          this.download.resume();
          info = 'Download was resumed!'
          console.log(info);
        } else {
          info = 'Download is not running or not paused!';
          console.log(info);
        }
        return info;

      // Send download stats only
      } else if (action == 'download-stats') {
        console.log('Sending stats only!');
        const stats = await this.download.getStats();
        stats['downloadRunning'] = this.downloadRunning;
        stats['downloadPaused'] = this.downloadPaused;
        stats['downloadSuccess'] = this.downloadSuccess;
        stats['downloadState'] = this.downloadState;
        stats['downloadError'] = this.downloadError;

        return JSON.stringify(stats);
      
      // Restore service database 
      } else if (action == 'restore') {
        if(!this.downloadRunning && this.downloadSuccess){
          if (!this.databaseRestoreRunning) {
          await this.restoreDB();
          info = 'Database restore was launched!'
          console.log(info);
          } else {
            info = 'Database restore is already running...'
            console.log(info);
          }
        } else {
          info = 'You must successfully download the database file before restore!'
          console.log(info);
        }
        return info;

      // Restore database process statistics
      } else if (action == 'restore-stats') {
        let stats = {};
        stats['databaseRestoreRunning'] = this.databaseRestoreRunning;
        stats['databaseRestoreSuccess'] = this.databaseRestoreSuccess;
        stats['databaseRestoreError'] = this.databaseRestoreError;
        return JSON.stringify(stats);

      } else {
        throw Error("Unknown action.");
      }

    } catch (error) {
      debug('serviceRestoreDB', error);
      throw error;
    }
  }

  // Triggered if download was successfull
  async restoreDB() {
    try {

      // Turn off orchestrator and stop service container
      await this.restoreStartPrepare();

      const dataBasePath = this.service.getDatabasePath();
      const backupURL = this.service.getBackupURL();
      const fileName = backupURL.split('/').pop();

      console.log(`Restoring database from file /${fileName}...`);

      // Removing all from dataBasePath directory
      console.log(`Removing all files from ${dataBasePath} directory...`);
      fsExtra.emptyDirSync(`${dataBasePath}`);

      // Extacting downloaded archive to dataBasePath directory
      console.log(`Extracting /${fileName} into ${dataBasePath}.`);
      const extract = jaguar.extract(`/${fileName}`, dataBasePath);

      // Extract events
      extract.on('file', (name) => {
          console.log(`Extracting file: ${name}...`);
      });

      extract.on('progress', (percent) => {
          console.log(`Extracting progress: ${percent} %`);
      });

      extract.on('error', (error) => {
        const errorMsg = `Extracting file error: ${error}`;
          console.log(errorMsg);
          this.databaseRestoreError = errorMsg;
          // If error we will relaunch orchestration and service in passive mode
          this.restoreStopPrepare();
      });

      extract.on('end', () => {
          console.log(`Extracting file success!!`);
          this.databaseRestoreSuccess = true;
          // If success we will relaunch orchestration and service in passive mode
          this.restoreStopPrepare();
          this.databaseRestoreError = '';
      });

    } catch (error) {
      debug('restoreDB', error);
      throw error;
    }
  }

  // Prepare the orchestrator if download will be started
  async restoreStartPrepare() {
    this.databaseRestoreRunning = true;
    this.databaseRestoreSuccess = false;
    this.orchestrationEnabled = false;
    this.chain.heartbeatSendEnabled = false;
    await this.serviceCleanUp();
  }

  // Prepare the orchestrator if download will be stopped
  async restoreStopPrepare() {
    this.databaseRestoreRunning = false;
    this.orchestrationEnabled = true;
    this.chain.heartbeatSendEnabled = true;
    await this.serviceStart('passive');
  }

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

module.exports = { Orchestrator };
