const express = require('express');
const asyncHandler = require('express-async-handler')
const bodyParser = require('body-parser');

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
  const isServiceReadyToStart = await orchestrator.isServiceReadyToStart();
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
      suspendService: orchestrator.suspendService,
      isServiceReadyToStart: isServiceReadyToStart,
      serviceMode: orchestrator.mode,
      serviceContainer: launchedContainer,
      metrics: metrics
  }
  return result;
}

// Return not found response
const get404 = (req, res, next) => {
  const error = {
    errors: [
      {
        status: '404',
        title: 'Not found',
        detail: 'Requested resource was not found.'
      }
    ]
  };
  res.status(404).json(error);
};

// Simple error handler
const errorHandler = (err, req, res, next) => {
    const error = {
      errors: [
        {
          status: '500',
          title: 'Error',
          detail: err.toString()
        }
      ]
    };
    res.status(500).json(error);
};

// Init api
const initApi = async orchestrator => {
    const app = express();

    // Add body parser to express
    app.use(bodyParser.urlencoded({ extended: false }));
    
    // Add main route
    app.get('/', asyncHandler(async (req, res) => {
        // Get orchestrator info object
        const ret = await getOrchestratorInfo(orchestrator);

        // Return object as json
        res.json(ret);
    }));

    // Add not found middleware
    app.use(get404);
    
    // Add error handler
    app.use(errorHandler);

    // Set listen port
    app.listen(3000);

}

module.exports = {
    initApi
}