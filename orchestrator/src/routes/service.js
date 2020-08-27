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
  await orchestrator.serviceStart(mode);
};

// Stopping service in any mode
const serviceStop = async orchestrator => {
  console.log('[API] Stopping and removing service container...');
  await orchestrator.serviceCleanUp();
};

// Restoring service database
const serviceRestoreDB = async (orchestrator, action) => {
  console.log('[API] Restoring service database...');
  return await orchestrator.serviceRestoreDB(action);
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

// Start a restore of service database
router.get('/restore-db-start', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  const stats = await serviceRestoreDB(orchestrator, 'start');
  res.json({
    status: '200',
    message: 'Request Success! ' + stats
  });
}));

// Stop the restore of service database
router.get('/restore-db-stop', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  const stats = await serviceRestoreDB(orchestrator, 'stop');
  res.json({
    status: '200',
    message: 'Request Success! ' + stats
  });
}));

// Pause the restore of service database
router.get('/restore-db-pause', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  const stats = await serviceRestoreDB(orchestrator, 'pause');
  res.json({
    status: '200',
    message: 'Request Success! ' + stats
  });
}));

// Resume the restore of service database
router.get('/restore-db-resume', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  const stats = await serviceRestoreDB(orchestrator, 'resume');
  res.json({
    status: '200',
    message: 'Request Success! ' + stats
  });
}));

// Get stats of service database restore
router.get('/restore-db-stats', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  const stats = await serviceRestoreDB(orchestrator, 'stats');
  res.json({
    status: '200',
    message: 'Request Success! ' + stats
  });
}));

exports.routes = router;
