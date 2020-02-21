const express = require('express');

const { getConfig,
        deleteConfig,
        generateConfig
} = require('../generate');

const router = express.Router();

router.get('/', getConfig);

router.delete('/', deleteConfig);

router.post('/', generateConfig);

exports.routes = router;