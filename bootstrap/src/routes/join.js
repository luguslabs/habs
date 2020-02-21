const express = require('express');

const { joinFederation } = require('../join');

const router = express.Router();

router.post('/', joinFederation);

exports.routes = router;
