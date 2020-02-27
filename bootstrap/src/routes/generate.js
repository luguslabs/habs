const express = require('express');

const {
  getConfig,
  //deleteConfig,
  generateConfig,
  checkGenerateRequestFields
} = require('../generate');

const router = express.Router();

// Get config file route
router.get('/', getConfig);

// Delete config file route
// router.delete('/', deleteConfig);

// Check request fields before config generating
router.post('/', checkGenerateRequestFields);

// Generate configuration
router.post('/', generateConfig);

exports.routes = router;
