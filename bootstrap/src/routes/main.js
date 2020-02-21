const express = require('express');

const { getIndexPage } = require('../main');

const router = express.Router();

router.get('/', getIndexPage);

exports.routes = router;
