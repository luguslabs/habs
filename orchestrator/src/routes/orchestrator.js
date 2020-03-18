const express = require('express');
const router = express.Router();

// Disable orchestration function
const disableOrchestration = orchestrator => {
  if (orchestrator.orchestrationEnabled) {
    orchestrator.orchestrationEnabled = false;
    console.log('[API] Orchestration was disabled...');
    return true;
  }
  return false;
};

// Enable orchestration function
const enableOrchestration = orchestrator => {
  if (!orchestrator.orchestrationEnabled) {
    orchestrator.orchestrationEnabled = true;
    console.log('[API] Orchestration was enabled...');
    return true;
  }
  return false;
};

// Disable orchestration
router.get('/disable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (disableOrchestration(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Orchestration was disabled.'
    });
  } else {
    throw Error('Orchestration is already disabled.');
  }
});

// Enable orchestration
router.get('/enable', (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');

  if (enableOrchestration(orchestrator)) {
    res.json({
      status: '200',
      message: 'Success! Orchestration was enabled.'
    });
  } else {
    throw Error('Orchestration is already enabled.');
  }
});

exports.routes = router;
