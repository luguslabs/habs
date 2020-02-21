const express = require('express');

const router = express.Router();
const Service = require('../service');

const { asyncMiddleware } = require('../utils');

router.get('/', asyncMiddleware(async (req, res, next) => {
  const services = await Service.getServices();
  res.json(services);
}));

exports.routes = router;
