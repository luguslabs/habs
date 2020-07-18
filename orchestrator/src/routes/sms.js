const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');

// Post inbound-sms
router.post(
  '/webhooks/inbound-sms',
  asyncHandler(async (req, res) => {
    const orchestrator = req.app.get('orchestrator');
    const params = Object.assign(req.query, req.body);
    console.log('/webhooks/inbound-sms');
    // console.log(params);
    if (params && params.text && params.text.toString() !== '') {
      console.log('text:'+params.text.toString());
      orchestrator.smsStonithCallbackStatus = params.text.toString();
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
    if (params && params.text && params.text.toString() !== '') {
      console.log('text:'+params.text.toString());
      orchestrator.smsStonithCallbackStatus = params.text.toString();
    }
    res.status(204).send();
  })
);

exports.routes = router;
