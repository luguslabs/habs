const express = require('express');

const path = require('path');

const { rootDir } = require('../utils');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.sendFile(path.join(rootDir, 'views', 'index.html'));
});

router.post('/', (req, res, next) => {
    res.redirect('/');
});

exports.routes = router;