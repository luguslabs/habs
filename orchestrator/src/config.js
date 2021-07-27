const dotenv = require('dotenv');
const {
  checkVariable,
  readToObj
} = require('./utils');

// Construct configuration from env variables
const constructConfiguration = () => {
  // Import env variables from .env file
  dotenv.config();
  let config = {};

  // Get configuration from config file
  if (process.env.CONFIG_FILE) {
    // Setting default config path if is not set by env var
    config.configFilePath = process.env.CONFIG_FILE_PATH || '/config/config.json';

    // Constructing configuration from config file
    config = { ...constructConfigurationFromConfigFile(process.env.CONFIG_FILE_PATH, process.env.NODE_ID) };
  }

  // If config was not set by config file trying to get it from env variables
  // If env variables are empty setting default values
  config.mnemonic = config.mnemonic ? config.mnemonic : process.env.MNEMONIC;
  config.service = config.service ? config.service : process.env.SERVICES || 'polkadot';
  config.nodesWallets = config.nodesWallets ? config.nodesWallets : process.env.NODES_WALLETS;
  config.archipelName = config.archipelName ? config.archipelName : process.env.ARCHIPEL_NAME || 'test-archipel';
  config.nodeGroupId = config.nodeGroupId ? config.nodeGroupId : process.env.NODE_GROUP_ID || 1;
  config.nodeRole = config.nodeRole ? config.nodeRole : process.env.NODE_ROLE || 'operator';

  // Get config from env variables and setting default values if env vars are empty
  config.nodeWs = process.env.NODE_WS || 'ws://127.0.0.1:9944';
  config.aliveTime = process.env.ALIVE_TIME || 12;
  config.serviceMode = process.env.ARCHIPEL_SERVICE_MODE || 'orchestrator';
  config.heartbeatEnabled = process.env.ARCHIPEL_HEARTBEATS_ENABLE;
  config.orchestrationEnabled = process.env.ARCHIPEL_ORCHESTRATION_ENABLE;
  config.heartbeatEnabled = (!config.heartbeatEnabled || !config.heartbeatEnabled.includes('false'));
  config.orchestrationEnabled = (!config.orchestrationEnabled || !config.orchestrationEnabled.includes('false'));

  // Parsing integers
  config.aliveTime = parseInt(config.aliveTime);
  if (isNaN(config.aliveTime)) throw Error('Alive time must be an integer');
  config.nodeGroupId = parseInt(config.nodeGroupId);
  if (isNaN(config.nodeGroupId)) throw Error('Node group id must be an integer');

  // check if all variables are set
  Object.keys(config).forEach(key => {
    checkVariable(config[key], `${key}`);
  });

  return config;
};

const constructConfigurationFromConfigFile = (configFilePath, nodeId) => {
  const config = {};

  // Get and parse node id
  config.nodeId = parseInt(nodeId);
  if (isNaN(config.nodeId)) throw Error('Node id must be set and must be an integer');

  // Read config file to an object
  config.configFilePath = configFilePath;
  const configObject = readToObj(config.configFilePath);

  try {
    // Check if node number is valid must be from 1 and the nodesNumber
    if (configObject.nodesNumber < config.nodeId || config.nodeId <= 0) {
      throw Error(`Invalid node id. It must be between 1 and ${configObject.nodesNumber}`);
    }

    // Trying to get info from config file
    config.mnemonic = configObject.archipelNodes[config.nodeId - 1].seed;
    config.service = configObject.services[0].name;
    config.nodesWallets = configObject.archipelSr25519List;
    config.archipelName = configObject.name;
    config.nodeGroupId = configObject.nodesGroupId.split(',')[config.nodeId - 1];
    config.nodeRole = configObject.nodesRole.split(',')[config.nodeId - 1];
  } catch (error) {
    throw Error(`${error.toString()}. Please check config file.`);
  }
  return config;
};

module.exports = {
  constructConfiguration,
  constructConfigurationFromConfigFile
};
