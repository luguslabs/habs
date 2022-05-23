const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
  // Constructing info object
  return {
    status: '200',
    ...(await orchestrator.getOrchestratorInfo())
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
