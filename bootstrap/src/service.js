const path = require('path');
const fs = require('fs');
const {
  rootDir
} = require('./utils');

const {
  generateNodeIds
} = require('./substrate');

// Service file path
const serviceFile = path.join(rootDir, '..', 'services.json');

// Get services from service config file
const getServices = () => {
  const fileContent = fs.readFileSync(serviceFile);
  return JSON.parse(fileContent);
};

// Generate service configuration
const generateServiceConfig = (reqBody, federationSize) => {
  const config = {};

  // Add service info to configuration
  const services = getServices();
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

    // Create reserved peers list
    config.service.reservedPeersList = config.service.nodeIds.reduce((listArray, currentValue, currentIndex) => {
      return listArray.concat(`/ip4/10.0.1.${currentIndex + 1}/tcp/30333/p2p/${currentValue.peerId},`);
    }, '').slice(0, -1);

  } else {
    throw new Error(`Service ${reqBody.service} was not found`);
  }

  return config;
};

module.exports = {
  getServices,
  generateServiceConfig
};
