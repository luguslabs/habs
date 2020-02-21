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
  // Check if config file already exists
  if (!fs.existsSync(configFilePath)) {
    // Create temp directory
    if (fs.existsSync(tempDir)) {
      rmNonEmptyDir(tempDir);
      fs.mkdirSync(tempDir);
    } else {
      fs.mkdirSync(tempDir);
    }

    const config = {};

    // Add service info to configuration
    const services = Service.getServices();
    const service = services.find(srv => srv.name === req.body.service);

    // If service was found adding all service fields to config
    if (service) {
      config.service = { name: service.name };
      service.fields.forEach(field => {
        if (req.body[field.name] !== undefined && req.body[field.name] !== '') {
          config.service[field.name] = req.body[field.name];
        } else {
          throw Error(`'${field.label}' field was not set.`);
        }
      });
    } else {
      throw new Error(`Service ${req.body.service} was not found`);
    }

    // Get external ips list
    const externalIPAddresses = req.body.ips;
    const externalIPAddressesList = externalIPAddresses.split(',');

    // Generate Wireguard keys
    config.wireGuardKeys = generateWireguardKeys(externalIPAddressesList.length);

    // Generate Archipel Substrate keys
    config.archipelSubstrateKeys = generateSubstrateKeys(externalIPAddressesList.length);

    // Generate Archipel Node Ids
    config.archipelNodeIds = generateNodeIds(externalIPAddressesList.length);

    // Writing JSON to file
    fs.writeFileSync('/tmp/archipel-bootstrap/config.json', JSON.stringify(config), 'utf8');

    // Creating Archive with config data
    createArchive('/tmp/archipel-bootstrap', configFilePath);

    // Removing temporary directory
    rmNonEmptyDir(tempDir);

    res.status(200).json({
      message: 'Config file was created'
    });
  } else {
    throw new Error('Config file already exists');
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
const generateNodeIds = nodesNumber => {
  const nodeIds = [];

  for (let i = 0; i < nodesNumber; i++) {
    const node = {};
    const subKeyResult = execCmdSync(`subkey generate-node-key /tmp/archipel-bootstrap/node-id-${i}`).match(/[A-Za-z0-9+=/]*/).toString();
    node.peerId = subKeyResult;
    node.idFile = `node-id-${i}`;
    nodeIds.push(node);
  }

  return nodeIds;
};

// Create a zip Archive
const createArchive = (folderPath, resultFilePath) => {
  execCmdSync(`zip -r -j ${resultFilePath} ${folderPath}`);
};
