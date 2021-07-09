const Nexmo = require('nexmo');
const debug = require('debug')('app');
const dotenv = require('dotenv');

const {
  getKeysFromSeed,
  checkVariable
} = require('./utils');

// Import stonith env variables from .env file
dotenv.config();
const {
  SMS_STONITH_ACTIVE,
  SMS_STONITH_CALLBACK_MANDATORY,
  SMS_STONITH_CALLBACK_MAX_DELAY,
  AUTHORITIES_LIST,
  NEXMO_API_KEY,
  NEXMO_API_SECRET,
  NEXMO_API_SIGNATURE_METHOD,
  NEXMO_API_SIGNATURE_SECRET,
  NEXMO_API_CHECK_MSG_SIGNATURE,
  NEXMO_PHONE_NUMBER,
  OUTLET_PHONE_NUMBER_LIST
} = process.env;

// Check if all necessary env vars were set
const checkEnvVars = () => {
  try {
    checkVariable(SMS_STONITH_ACTIVE, 'SMS_STONITH_ACTIVE');
    if (!SMS_STONITH_ACTIVE.includes('false')) {
      checkVariable(SMS_STONITH_CALLBACK_MANDATORY, 'SMS_STONITH_CALLBACK_MANDATORY');
      checkVariable(SMS_STONITH_CALLBACK_MAX_DELAY, 'SMS_STONITH_CALLBACK_MAX_DELAY');
      checkVariable(NEXMO_API_CHECK_MSG_SIGNATURE, 'NEXMO_API_CHECK_MSG_SIGNATURE');
      checkVariable(AUTHORITIES_LIST, 'AUTHORITIES_LIST');
    }
  } catch (error) {
    debug('checkEnvVars', error);
    throw error;
  }
};

class Stonith {
  constructor (orchestrator) {
    checkEnvVars();

    this.orchestrator = orchestrator;
    this.stonithActive = !SMS_STONITH_ACTIVE.includes('false');

    if (this.stonithActive) {
      this.smsStonithActiveCallbackMandatory = SMS_STONITH_CALLBACK_MANDATORY;
      this.smsStonithActiveCallbackMaxDelay = SMS_STONITH_CALLBACK_MAX_DELAY;
      this.nexmoApiKey = NEXMO_API_KEY ? NEXMO_API_KEY.replace(/"/g, '') : '';
      this.nexmoApiSecret = NEXMO_API_SECRET ? NEXMO_API_SECRET.replace(/"/g, '') : '';
      this.nexmoApiSignatureMethod = NEXMO_API_SIGNATURE_METHOD ? NEXMO_API_SIGNATURE_METHOD.replace(/"/g, '') : '';
      this.nexmoApiSignatureSecret = NEXMO_API_SIGNATURE_SECRET ? NEXMO_API_SIGNATURE_SECRET.replace(/"/g, '') : '';
      this.nexmoApiCheckMsgSignature = NEXMO_API_CHECK_MSG_SIGNATURE;
      this.nexmoPhoneNumber = NEXMO_PHONE_NUMBER ? NEXMO_PHONE_NUMBER.replace(/"/g, '') : '';
      this.outletPhoneNumberList = OUTLET_PHONE_NUMBER_LIST ? OUTLET_PHONE_NUMBER_LIST.replace(/"/g, '') : '';
      this.smsStonithCallbackStatus = 'none';
      this.authoritiesList = AUTHORITIES_LIST;
    }
  }

  async shootOldValidator (nodeKey) {
    console.log(this.orchestrator);
    if (this.stonithActive === 'false') {
      console.log('Stonith is not activated.');
      return true;
    }

    const isLeadedGroup = await this.orchestrator.chain.isLeadedGroup(this.orchestrator.group);
    console.log('Stonith is activated.');

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
          'sms callback not received and is mandatory. Shutdown orchestrator to stay in passive mode... '
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

    return true;
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
}

module.exports = { Stonith };
