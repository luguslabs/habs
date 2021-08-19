const dotenv = require('dotenv');

const {
  readToObj,
  checkVariable
} = require('../../utils');

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
    config = { ...constructConfigurationFromConfigFile(config.configFilePath, process.env.NODE_ID) };
  }

  // General configuration
  config.polkadotUnixUserId = 1000;
  config.polkadotUnixGroupId = 1000;
  config.polkadotRpcPort = 9993;

  // Mandatory environment variables
  config.polkadotName = config.polkadotName ? config.polkadotName : process.env.POLKADOT_NAME;
  config.polkadotImage = process.env.POLKADOT_IMAGE || 'parity/polkadot:latest';
  config.polkadotPrefix = process.env.POLKADOT_PREFIX || 'node-';
  config.polkadotKeyGran = config.polkadotKeyGran ? config.polkadotKeyGran : process.env.POLKADOT_KEY_GRAN;
  config.polkadotKeyBabe = config.polkadotKeyBabe ? config.polkadotKeyBabe : process.env.POLKADOT_KEY_BABE;
  config.polkadotKeyImon = config.polkadotKeyImon ? config.polkadotKeyImon : process.env.POLKADOT_KEY_IMON;
  config.polkadotKeyPara = config.polkadotKeyPara ? config.polkadotKeyPara : process.env.POLKADOT_KEY_PARA;
  config.polkadotKeyAsgn = config.polkadotKeyAsgn ? config.polkadotKeyAsgn : process.env.POLKADOT_KEY_ASGN;
  config.polkadotKeyAudi = config.polkadotKeyAudi ? config.polkadotKeyAudi : process.env.POLKADOT_KEY_AUDI;

  // Check for mandatory env variables
  Object.keys(config).forEach(key => {
    checkVariable(config[key], `${key}`);
  });

  // Optional environment variables
  config.polkadotValidatorName = process.env.POLKADOT_VALIDATOR_NAME;
  config.polkadotReservedNodes = process.env.POLKADOT_RESERVED_NODES;
  config.polkadotTelemetryUrl = process.env.POLKADOT_TELEMETRY_URL;
  config.polkadotNodeKeyFile = process.env.POLKADOT_NODE_KEY_FILE;
  config.polkadotAdditionalOptions = process.env.POLKADOT_ADDITIONAL_OPTIONS;
  config.databasePath = process.env.POLKADOT_DATABASE_PATH || '/data';
  config.polkadotSessionKeyToCheck = process.env.POLKADOT_SESSION_KEY_TO_CHECK;

  config.polkadotSimulateSynch = process.env.POLKADOT_SIMULATE_SYNCH || false;
  config.polkadotSimulateSynch = (config.polkadotSimulateSynch && config.polkadotSimulateSynch.includes('true'));

  config.testing = process.env.TESTING || false;
  config.testing = (config.testing && config.testing.includes('true'));

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
    config.polkadotName = `${configObject.name}-node-${config.nodeId}`;
    config.polkadotKeyGran = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_GRAN').value;
    config.polkadotKeyBabe = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_BABE').value;
    config.polkadotKeyImon = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_IMON').value;
    config.polkadotKeyPara = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_PARA').value;
    config.polkadotKeyAsgn = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_ASGN').value;
    config.polkadotKeyAudi = configObject.services[0].fields[config.nodeId - 1].find(element => element.env === 'POLKADOT_KEY_AUDI').value;
    config.polkadotReservedNodes = configObject.services[0].reservedPeersList;
    config.polkadotNodeKeyFile = configObject.services[0].nodeIds[config.nodeId - 1].idFile;
  } catch (error) {
    throw Error(`${error.toString()}. Please check config file.`);
  }

  return config;
};

module.exports = {
  constructConfiguration
};
