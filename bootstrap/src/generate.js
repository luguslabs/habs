const path = require('path');
const fs = require('fs');
const {
  rootDir,
  rmNonEmptyDir,
  execCmdSync
} = require('./utils');

const Service = require('./service');

const configFile = 'config.zip';
const tempDir = '/tmp/archipel-bootstrap';
const configFilePath = path.join(rootDir, 'public', configFile);

// Get configuration Archive
exports.getConfig = (req, res, next) => {
  if (!fs.existsSync(configFilePath)) {
    throw new Error('Configuration file was not found');
  } else {
    res.redirect(configFile);
  }
};

// Delete configuration Archive
exports.deleteConfig = (req, res, next) => {
  if (!fs.existsSync(configFilePath)) {
    throw new Error('Configuration file was not found');
  } else {
    fs.unlinkSync(configFilePath);
    res.status(200).json({
      message: 'Configuration file was deleted'
    });
  }
};

// Generate configuration Archive
exports.generateConfig = (req, res, next) => {
  // Config file checks
  checkConfigFile(configFilePath, tempDir);

  // Check request fields
  checkRequestFields(req.body);

  // Start constructing config
  let config = {
    name: req.body.name
  };
  const externalIPAddresses = req.body.ips.split(',');

  // Adding service config
  config = { ...config, ...addServiceConfig(req.body, externalIPAddresses.length) };

  // Adding wireguard config
  config = { ...config, ...addWireguardConfig(externalIPAddresses) };

  // Adding Archipel config
  config = { ...config, ...addArchipelConfig(externalIPAddresses.length) };

  // Write configuration to file
  writeConfigToFile(config, configFilePath, tempDir);

  res.status(200).json({
    message: 'Config file was created'
  });
};

const checkConfigFile = (configFilePath, tempDir) => {
  // Check if config file already exists
  if (fs.existsSync(configFilePath)) {
    throw new Error('Config file already exists');
  }

  // Create temp directory
  if (fs.existsSync(tempDir)) {
    rmNonEmptyDir(tempDir);
    fs.mkdirSync(tempDir);
  } else {
    fs.mkdirSync(tempDir);
  }
};

const writeConfigToFile = (config, configFilePath, tempDir) => {
  // Writing JSON to file
  fs.writeFileSync('/tmp/archipel-bootstrap/config.json', JSON.stringify(config), 'utf8');

  // Creating Archive with config data
  createArchive('/tmp/archipel-bootstrap', configFilePath);

  // Removing temporary directory
  rmNonEmptyDir(tempDir);
};

const addArchipelConfig = (federationSize) => {
  const config = {};

  // Generate keys
  const substrateKeys = generateSubstrateKeys(federationSize);

  // Constructing SR Wallets List
  config.archipelSr25519List = substrateKeys.map(element => element.sr25519Address).join(',');

  // Constructing Ed Wallets List
  config.archipelEd25519List = substrateKeys.map(element => element.ed25519Address).join(',');

  // Generate NodesIds
  const nodeIds = generateNodeIds('archipel', federationSize);

  // Constructing boot nodes list
  const bootNodesList = nodeIds.reduce((listArray, currentValue, currentIndex) => {
    return listArray.concat(`--bootnodes /ip4/10.0.1.${currentIndex + 1}/tcp/30333/p2p/${currentValue.peerId} `);
  }, '').slice(0, -1);

  // Filling Archipel Nodes configuration
  config.archipelNodes = [];
  for (let i = 0; i < federationSize; i++) {
    config.archipelNodes.push({ seed: substrateKeys[i].seed, nodeIds: nodeIds[i], bootNodesList: bootNodesList });
  }

  return config;
};

const checkRequestFields = reqBody => {
  // Check if federation name was set
  if (reqBody.name === undefined || reqBody.name === '') {
    throw new Error('Please set federation name');
  }

  if (reqBody.name === undefined || reqBody.name === '') {
    throw new Error('Please set federation name');
  }

  // Check if ip list was set
  if (reqBody.ips === undefined || reqBody.ips === '') {
    throw new Error('Please set ip list');
  }

  // Archipel federation must have minimum 3 nodes
  if (reqBody.ips.split(',').length < 3) {
    throw new Error('Ip list must have minimum 3 addresses');
  }
};

// Generate Wireguard keys
const generateWireguardKeys = keysNumber => {
  const keys = [];
  for (let i = 0; i < keysNumber; i++) {
    const key = {};
    key.privateKey = execCmdSync('wg genkey').match(/[A-Za-z0-9+=/]*/).toString();
    key.publicKey = execCmdSync(`echo ${key.privateKey} | wg pubkey`).match(/[A-Za-z0-9+=/]*/).toString();

    if (key.privateKey.length === 44 && key.publicKey.length === 44) {
      keys.push(key);
    }
  }
  return keys;
};

// Prepare Wireguard configuration
const addWireguardConfig = externalIPAddresses => {
  const config = {};

  // Add port number to addresses and add to config
  config.wireguardExternalAddrList = externalIPAddresses.map(element => `${element}:51820`).join(',');

  // Generate Wireguard keys
  const wireGuardKeys = generateWireguardKeys(externalIPAddresses.length);

  // Constructing Wireguard peers public addresses list
  config.wireguardPeersPubAddrList = wireGuardKeys.map(element => element.publicKey).join(',');

  // Fill allowedIpsList and nodes private addresses
  const wireguardAllowedIpsList = [];
  config.wireguardNodes = [];
  for (let i = 0; i < externalIPAddresses.length; i++) {
    config.wireguardNodes.push({ privateKey: wireGuardKeys[i].privateKey });
    wireguardAllowedIpsList.push(`10.0.1.${i + 1}/32`);
  }

  config.wireguardAllowedIpsList = wireguardAllowedIpsList.join(',');

  return config;
};

// Add service configuration
const addServiceConfig = (reqBody, federationSize) => {
  const config = {};

  // Add service info to configuration
  const services = Service.getServices();
  const service = services.find(srv => srv.name === reqBody.service);

  // If service was found adding all service fields to config
  if (service) {
    // Fill name and init fields
    config.service = { name: service.name };
    config.service.fields = [];

    // Fill each field value in config
    service.fields.forEach(field => {
      // If service field was set in request
      if (reqBody[field.name] !== undefined && reqBody[field.name] !== '') {
        config.service.fields.push({ name: field.name, value: reqBody[field.name], env: field.env });
      } else {
        throw Error(`'${field.label}' field was not set.`);
      }
    });

    // Generate Service Node Ids
    config.service.nodeIds = generateNodeIds(service.name, federationSize);
  } else {
    throw new Error(`Service ${reqBody.service} was not found`);
  }

  return config;
};

// Generate Substrate Keys and extract sr25519 and ed25519 addresses
const generateSubstrateKeys = keysNumber => {
  const keys = [];
  for (let i = 0; i < keysNumber; i++) {
    const key = {};

    const subKeyResult = execCmdSync('subkey -n substrate generate');
    key.seed = subKeyResult.match(/`.*`/).toString().replace(/`/gi, '').toString();
    key.sr25519Address = subKeyResult.match(/SS58 Address:.*/).toString().replace(/SS58 Address: {5}/, '').toString();

    const subKeyResultEd = execCmdSync(`subkey -n substrate --ed25519 inspect "${key.seed}"`);
    key.ed25519Address = subKeyResultEd.match(/SS58 Address:.*/).toString().replace(/SS58 Address: {5}/, '').toString();

    keys.push(key);
  }
  return keys;
};

// Create Node id files and get Peer Ids
const generateNodeIds = (service, nodesNumber) => {
  const nodeIds = [];

  for (let i = 0; i < nodesNumber; i++) {
    const node = {};
    const subKeyResult = execCmdSync(`subkey generate-node-key /tmp/archipel-bootstrap/${service}-node-id-${i}`).match(/[A-Za-z0-9+=/]*/).toString();
    node.peerId = subKeyResult;
    node.idFile = `${service}-node-id-${i}`;
    nodeIds.push(node);
  }

  return nodeIds;
};

// Create a zip Archive
const createArchive = (folderPath, resultFilePath) => {
  execCmdSync(`zip -r -j ${resultFilePath} ${folderPath}`);
};
