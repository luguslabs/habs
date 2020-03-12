const {
  isEmptyString
} = require('./utils');

const {
  generateNodeIds
} = require('./substrate');

const {
  validatePolkadotConfig,
  polkadotFields
} = require('./polkadot');

let serviceFields = [];

// Validate service config
const validateServiceConfig = async configData => {
  // Check if service is supported
  if (configData.service === 'polkadot') {
    await validatePolkadotConfig(configData);
    serviceFields = polkadotFields;
  } else {
    throw Error(`Service ${configData.service} is not supported yet.`);
  }

  // Fill each field value in config
  serviceFields.forEach(field => {
    // If service field was set in request
    isEmptyString(configData[field.name], `'${field.name}' field was not set in archipel.json file.`);
  });
};

// Generate service template
const generateServiceTemplate = serviceName => {
  if (serviceName === 'polkadot') {
    let template = {};

    serviceFields = polkadotFields;

    template.service = serviceName;

    const fields = serviceFields.map(el => el.name);
    const fieldsObject = fields.reduce((result, item) => {
      result[item] = '';
      return result;
    }, {});

    template = { ...template, ...fieldsObject };

    return template;
  } else {
    throw Error(`Service ${serviceName} is not supported yet.`);
  }
};

// Generate service configuration
const generateServiceConfig = async (configData, federationSize) => {
  const config = {};

  // Fill name and init fields
  config.service = { name: configData.service };
  config.service.fields = [];

  // Fill each field value in config
  serviceFields.forEach(field => {
    // If service field was set in request
    if (configData[field.name] !== undefined && configData[field.name] !== '') {
      config.service.fields.push({ name: field.name, value: configData[field.name], env: field.env });
    } else {
      throw Error(`'${field.label}' field was not set.`);
    }
  });

  // Generate Service Node Ids
  config.service.nodeIds = await generateNodeIds(configData.service, federationSize);

  // Create reserved peers list
  config.service.reservedPeersList = config.service.nodeIds.reduce((listArray, currentValue, currentIndex) => {
    return listArray.concat(`/ip4/10.0.1.${currentIndex + 1}/tcp/30333/p2p/${currentValue.peerId},`);
  }, '').slice(0, -1);

  return config;
};

module.exports = {
  generateServiceConfig,
  validateServiceConfig,
  generateServiceTemplate
};
