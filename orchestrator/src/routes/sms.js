const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Nexmo = require('nexmo');

// Post inbound-sms
router.post(
  '/webhooks/inbound-sms',
  asyncHandler(async (req, res) => {
    const orchestrator = req.app.get('orchestrator');
    const params = Object.assign(req.query, req.body);
    console.log('/webhooks/inbound-sms');
    // console.log(params);
    if (orchestrator.nexmoApiCheckMsgSignature === 'true') {
      const sigToCheck = Nexmo.generateSignature(orchestrator.nexmoApiSignatureMethod, orchestrator.nexmoApiSignatureSecret, params);
      if (sigToCheck && sigToCheck.toUpperCase() === params.sig) {
        console.log('Valid signature');
        if (params && params.text && params.text.toString() !== '') {
          console.log('text:' + params.text.toString());
          orchestrator.smsStonithCallbackStatus = params.text.toString();
        }
      } else {
        console.log('Invalid signature');
      }
    } else {
      console.log('Do not check signature');
      if (params && params.text && params.text.toString() !== '') {
        console.log('text:' + params.text.toString());
        orchestrator.smsStonithCallbackStatus = params.text.toString();
      }
    }
    res.status(204).send();
  })
);

// Get inbound-sms
router.get(
  '/webhooks/inbound-sms',
  asyncHandler(async (req, res) => {
    const orchestrator = req.app.get('orchestrator');
    const params = Object.assign(req.query, req.body);
    console.log('/webhooks/inbound-sms');
    // console.log(params);
    if (orchestrator.nexmoApiCheckMsgSignature === 'true') {
      const sigToCheck = Nexmo.generateSignature(orchestrator.nexmoApiSignatureMethod, orchestrator.nexmoApiSignatureSecret, params);
      if (sigToCheck && sigToCheck.toUpperCase() === params.sig) {
        console.log('Valid signature');
        if (params && params.text && params.text.toString() !== '') {
          console.log('text:' + params.text.toString());
          orchestrator.smsStonithCallbackStatus = params.text.toString();
        }
      } else {
        console.log('Invalid signature');
      }
    } else {
      console.log('Do not check signature');
      if (params && params.text && params.text.toString() !== '') {
        console.log('text:' + params.text.toString());
        orchestrator.smsStonithCallbackStatus = params.text.toString();
      }
    }
    res.status(204).send();
  })
);

exports.routes = router;
