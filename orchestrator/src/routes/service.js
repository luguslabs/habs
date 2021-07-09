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
  await orchestrator.service.serviceStart(mode);
};

// Stopping service in any mode
const serviceStop = async orchestrator => {
  console.log('[API] Stopping and removing service container...');
  await orchestrator.service.serviceCleanUp();
};

// Restoring service database
const serviceRestoreDB = async (restoredb, action) => {
  console.log(`[API] Service restore database ${action}...`);
  return await restoredb.serviceRestoreDB(action);
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

// Get stats of service database restore
router.get('/restore-db/download', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'download-stats');
  res.json({
    status: '200',
    message: stats
  });
}));

// Restore service database API section
// Start a restore of service database
router.get('/restore-db/download/start', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'download-start');
  res.json({
    status: '200',
    message: stats
  });
}));

// Stop the restore of service database
router.get('/restore-db/download/stop', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'download-stop');
  res.json({
    status: '200',
    message: stats
  });
}));

// Pause the restore of service database
router.get('/restore-db/download/pause', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'download-pause');
  res.json({
    status: '200',
    message: stats
  });
}));

// Resume the restore of service database
router.get('/restore-db/download/resume', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'download-resume');
  res.json({
    status: '200',
    message: stats
  });
}));

// Get stats of service database restore
router.get('/restore-db', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'restore-stats');
  res.json({
    status: '200',
    message: stats
  });
}));

// Retore the database after download
router.get('/restore-db/start', asyncHandler(async (req, res) => {
  // Get restoredb instance
  const restoredb = req.app.get('restoredb');
  const stats = await serviceRestoreDB(restoredb, 'restore');
  res.json({
    status: '200',
    message: stats
  });
}));

exports.routes = router;
