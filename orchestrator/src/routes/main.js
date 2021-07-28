const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

const { getKeysFromSeed } = require('../utils');

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
  // Constructing info object
  return {
    status: '200',
    orchestratorAddress: (await getKeysFromSeed(orchestrator.mnemonic)).address,
    archipelName: orchestrator.archipelName,
    isConnected: orchestrator.chain.isConnected(),
    peerId: await orchestrator.chain.getPeerId(),
    peerNumber: await orchestrator.chain.getPeerNumber(),
    bestNumber: await orchestrator.chain.getBestNumber(),
    synchState: await orchestrator.chain.getSyncState(),
    leader: await orchestrator.chain.getLeader(orchestrator.group),
    service: orchestrator.service.serviceName,
    orchestrationEnabled: orchestrator.orchestrationEnabled,
    isServiceReadyToStart: await orchestrator.service.serviceReady(),
    serviceMode: orchestrator.service.mode,
    serviceContainer: await orchestrator.service.serviceCheck(),
    heartbeatSendEnabledAdmin: orchestrator.heartbeatSendEnabledAdmin,
    heartbeatSendEnabled: orchestrator.heartbeatSendEnabled,
    heartbeats: orchestrator.heartbeats.getAllHeartbeats()
  };
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
