const path = require('path');
const fs = require('fs');
const {
  rootDir,
  checkConfigFile,
  writeConfigToFile
} = require('./utils');

const {
  generateWireguardConfig
} = require('./wireguard');

const {
  generateServiceConfig
} = require('./service');

const {
  generateArchipelConfig
} = require('./archipel');

const configFile = 'archipel-config.zip';
const tempDir = '/tmp/archipel-bootstrap';
const configFilePath = path.join(rootDir, 'public', configFile);

// Get configuration Archive
const getConfig = (req, res, next) => {
  if (!fs.existsSync(configFilePath)) {
    throw new Error('Configuration file was not found');
  } else {
    res.redirect(configFile);
  }
};

// Delete configuration Archive
const deleteConfig = (req, res, next) => {
  if (!fs.existsSync(configFilePath)) {
    throw new Error('Configuration file was not found');
  } else {
    fs.unlinkSync(configFilePath);
    res.status(200).json({
      message: 'Configuration file was deleted'
    });
  }
};

// Check fields of generate config file request
const checkGenerateRequestFields = (req, res, next) => {
  // Check if federation name was set
  if (req.body.name === undefined || req.body.name === '') {
    throw new Error('Please set federation name');
  }

  if (req.body.name === undefined || req.body.name === '') {
    throw new Error('Please set federation name');
  }

  // Check if ip list was set
  if (req.body.ips === undefined || req.body.ips === '') {
    throw new Error('Please set ip list');
  }

  // Archipel federation must have minimum 3 nodes
  if (req.body.ips.split(',').length < 3) {
    throw new Error('Ip list must have minimum 3 addresses');
  }

  next();
};

// Generate configuration archive
const generateConfig = (req, res, next) => {

  // Config file checks
  checkConfigFile(configFilePath, tempDir);

  // Start constructing config
  let config = {
    name: req.body.name
  };
  const externalIPAddresses = req.body.ips.split(',');

  // Add node number to config
  config.nodesNumber = externalIPAddresses.length;

  // Adding service config
  config = { ...config, ...generateServiceConfig(req.body, config.nodesNumber) };

  // Adding wireguard config
  config = { ...config, ...generateWireguardConfig(externalIPAddresses) };

  // Adding Archipel config
  config = { ...config, ...generateArchipelConfig(config.nodesNumber) };

  // Write configuration to file
  writeConfigToFile(config, configFilePath, tempDir);

  res.redirect(configFile);
  //res.status(200).json({
  //  message: 'Config file was created'
  //});
};

module.exports = {
  getConfig,
  deleteConfig,
  generateConfig,
  checkGenerateRequestFields
};
