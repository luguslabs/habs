const dotenv = require('dotenv');
const {
  checkVariable
} = require('./utils');

// Construct configuration from env variables
const constructConfiguration = () => {
  // Import env variables from .env file
  dotenv.config();
  const config = {};
  config.nodeWs = process.env.NODE_WS;
  config.mnemonic = process.env.MNEMONIC;
  config.aliveTime = process.env.ALIVE_TIME;
  config.service = process.env.SERVICES;
  config.serviceMode = process.env.ARCHIPEL_SERVICE_MODE;
  config.heartbeatEnabled = process.env.ARCHIPEL_HEARTBEATS_ENABLE;
  config.nodesWallets = process.env.NODES_WALLETS;
  config.archipelName = process.env.ARCHIPEL_NAME;
  config.nodeGroup = process.env.NODE_GROUP;
  config.nodeGroupId = process.env.NODE_GROUP_ID;

  // Setting default values for variables
  if (!config.heartbeatEnabled || !config.heartbeatEnabled.includes('false')) {
    config.heartbeatEnabled = true;
  }
  config.orchestrationEnabled = process.env.ARCHIPEL_ORCHESTRATION_ENABLE;
  if (!config.orchestrationEnabled || !config.orchestrationEnabled.includes('false')) {
    config.orchestrationEnabled = true;
  }

  Object.keys(config).forEach(key => {
    checkVariable(config[key], `${key}`);
  });

  return config;
};

module.exports = {
  constructConfiguration
};
