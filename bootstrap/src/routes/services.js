const express = require('express');

const {
  getServices
} = require('../service');

const router = express.Router();

// Get services list
router.get('/', (req, res, next) => {
  res.json(getServices());
});

exports.routes = router;
