const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

const { getKeysFromSeed } = require('../utils');

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
  // Get all necessary orchestrator data
  const heartbeats = orchestrator.heartbeats.getAllHeartbeats();

  const getOrchestratorKey = await getKeysFromSeed(orchestrator.mnemonic);
  const orchestratorAddress = getOrchestratorKey.address;

  const isConnected = orchestrator.chain.isConnected();
  const peerId = await orchestrator.chain.getPeerId();
  const peerNumber = await orchestrator.chain.getPeerNumber();
  const bestNumber = await orchestrator.chain.getBestNumber();
  const synchState = await orchestrator.chain.getSyncState();
  const currentLeader = await orchestrator.chain.getLeader(orchestrator.group);
  const isServiceReadyToStart = await orchestrator.service.serviceReady();
  const launchedContainer = await orchestrator.service.serviceCheck();

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
    service: orchestrator.service.serviceName,
    orchestrationEnabled: orchestrator.orchestrationEnabled,
    isServiceReadyToStart: isServiceReadyToStart,
    serviceMode: orchestrator.service.mode,
    serviceContainer: launchedContainer,
    heartbeatSendEnabledAdmin: orchestrator.heartbeatSendEnabledAdmin,
    heartbeatSendEnabled: orchestrator.heartbeatSendEnabled,
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
