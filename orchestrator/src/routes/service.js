const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');

// Check service start request fields
const checkRequestFields = (req, res, next) => {
  // Check if service start mode was set
  if (req.body.mode === undefined || req.body.mode === '') {
    throw new Error('Service start mode is empty');
  }
  next();
};

// Starting service in a specific mode
const serviceStart = async (orchestrator, mode) => {
  console.log(`[API] Starting service in ${mode} mode...`);
  if (mode === 'active') {
    await orchestrator.forceActive();
  } else {
    await orchestrator.service.serviceStart('passive');
  }
};

// Stopping service in any mode
const serviceStop = async orchestrator => {
  console.log('[API] Stopping and removing service container...');
  await orchestrator.service.serviceCleanUp();
};

// Check service start request fields
router.post('/start', checkRequestFields);

// Start service
router.post('/start', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  await serviceStart(orchestrator, req.body.mode);
  res.json({
    status: '200',
    message: `Success! Service was started in ${req.body.mode} mode.`
  });
}));

// Stop and remove service containers
router.get('/stop', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  await serviceStop(orchestrator);
  res.json({
    status: '200',
    message: 'Success! Service was stopped.'
  });
}));

exports.routes = router;
