const express = require('express');

const {
  getIndexPage
} = require('../main');

const router = express.Router();

// Show index page route
router.get('/', getIndexPage);

exports.routes = router;
