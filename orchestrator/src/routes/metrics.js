const express = require('express');
const router = express.Router();

// Disable metrics send
const disableMetrics = orchestrator => {
  if (orchestrator.chain.metricSendEnabled) {
    orchestrator.chain.metricSendEnabled = false;
    console.log('[API] Metrics send was disabled...');
    return true;
  }
  return false;
};

// Enable metrics send
const enableMetrics = orchestrator => {
  if (!orchestrator.chain.metricSendEnabled) {
    orchestrator.chain.metricSendEnabled = true;
    console.log('[API] Metrics send was enabled...');
    return true;
  }
  return false;
};

// Disable metrics send
router.get('/disable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (disableMetrics(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Metrics send was disabled.'
    });
  } else {
    throw Error('Metrics send is already disabled.');
  }
});

// Enable metrics send
router.get('/enable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (enableMetrics(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Metrics send was enabled.'
    });
  } else {
    throw Error('Metrics send is already enabled.');
  }
});

exports.routes = router;
