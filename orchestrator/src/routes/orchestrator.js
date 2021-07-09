const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

// Disable orchestration function
const disableOrchestration = async orchestrator => {
  if (orchestrator.orchestrationEnabled) {
    console.log('[API] Disabling orchestration...');
    orchestrator.orchestrationEnabled = false;
    console.log('[API] Waiting 5 sec to be sure that last orchestration cycle ended...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('[API] Forcing service in passive mode...');
    await orchestrator.service.serviceStart('passive');
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
router.get('/disable', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  // Disable orchestration
  const orchestrationDisabled = await disableOrchestration(orchestrator);

  if (orchestrationDisabled) {
    res.json({
      status: '200',
      message: 'Success! Orchestration was disabled.'
    });
  } else {
    throw Error('Orchestration is already disabled.');
  }
}));

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
