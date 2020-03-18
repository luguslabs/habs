const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
  // Get all necessary orchestrator data
  const metrics = orchestrator.metrics.getAllMetrics();
  const orchestratorAddress = await orchestrator.getOrchestratorAddress();
  const isConnected = orchestrator.chain.isConnected();
  const peerId = await orchestrator.chain.getPeeId();
  const peerNumber = await orchestrator.chain.getPeerNumber();
  const synchState = await orchestrator.chain.getSyncState();
  const currentLeader = await orchestrator.chain.getLeader();
  const isServiceReadyToStart = await orchestrator.isServiceReadyToStart(orchestrator.mode);
  const launchedContainer = await orchestrator.service.checkLaunchedContainer();

  // Constructing info object
  const result = {
    status: '200',
    orchestratorAddress: orchestratorAddress,
    isConnected: isConnected,
    peerId: peerId,
    peerNumber: peerNumber,
    synchState: synchState,
    leader: currentLeader,
    service: orchestrator.serviceName,
    orchestrationEnabled: orchestrator.orchestrationEnabled,
    isServiceReadyToStart: isServiceReadyToStart,
    serviceMode: orchestrator.mode,
    serviceContainer: launchedContainer,
    metricSendEnabled: orchestrator.metricSendEnabled,
    metrics: metrics
  };
  return result;
};

// Show main page route
router.get('/', asyncHandler(async (req, res) => {
  // Get orchestrator instance
  const orchestrator = req.app.get('orchestrator');
  // Get orchestrator info object
  const ret = await getOrchestratorInfo(orchestrator);

  // Return object as json
  res.json(ret);
}));

exports.routes = router;
