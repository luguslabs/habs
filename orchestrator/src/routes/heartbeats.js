const express = require('express');
const router = express.Router();

// Disable heartbeats send
const disableHeartbeats = orchestrator => {
  if (orchestrator.chain.heartbeatSendEnabledAdmin) {
    orchestrator.chain.heartbeatSendEnabledAdmin = false;
    console.log('[API] Heartbeats send was disabled...');
    return true;
  }
  return false;
};

// Enable heartbeats send
const enableHeartbeats = orchestrator => {
  if (!orchestrator.chain.heartbeatSendEnabledAdmin) {
    orchestrator.chain.heartbeatSendEnabledAdmin = true;
    console.log('[API] Heartbeats send was enabled...');
    return true;
  }
  return false;
};

// Disable heartbeats send
router.get('/disable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (disableHeartbeats(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Heartbeats send was disabled.'
    });
  } else {
    throw Error('Heartbeats send is already disabled.');
  }
});

// Enable heartbeats send
router.get('/enable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (enableHeartbeats(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Heartbeats send was enabled.'
    });
  } else {
    throw Error('Heartbeats send is already enabled.');
  }
});

exports.routes = router;
