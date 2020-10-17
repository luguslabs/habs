const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
  // Get all necessary orchestrator data
  const heartbeats = orchestrator.heartbeats.getAllHeartbeats();
  const orchestratorAddress = await orchestrator.getOrchestratorAddress();
  const isConnected = orchestrator.chain.isConnected();
  const peerId = await orchestrator.chain.getPeeId();
  const peerNumber = await orchestrator.chain.getPeerNumber();
  const bestNumber = await orchestrator.chain.getBestNumber();
  const synchState = await orchestrator.chain.getSyncState();
  const currentLeader = await orchestrator.chain.getLeader(orchestrator.group);
  const isServiceReadyToStart = await orchestrator.isServiceReadyToStart(orchestrator.mode);
  const launchedContainer = await orchestrator.services[0].checkLaunchedContainer();

  // Constructing info object
  const result = {
    status: '200',
    orchestratorAddress: orchestratorAddress,
    archipelName: orchestrator.archipelName,
    isConnected: isConnected,
    peerId: peerId,
    peerNumber: peerNumber,
    bestNumber: bestNumber,
    synchState: synchState,
    leader: currentLeader,
    service: orchestrator.serviceName,
    orchestrationEnabled: orchestrator.orchestrationEnabled,
    isServiceReadyToStart: isServiceReadyToStart,
    serviceMode: orchestrator.mode,
    serviceContainer: launchedContainer,
    heartbeatSendEnabledAdmin: orchestrator.chain.heartbeatSendEnabledAdmin,
    heartbeatSendEnabled: orchestrator.chain.heartbeatSendEnabled,
    heartbeats: heartbeats
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
