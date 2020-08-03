const { generateNodeIds } = require('./substrate');

const { validatePolkadotConfig, polkadotFields } = require('./polkadot');

// Validate service config
const validateServicesConfig = async (configData) => {
  // Check if service is supported
  const servicesList = configData.services;
  for (const service of servicesList) {
    const serviceName = service.name;
    // Check if service is supported
    if (serviceName === 'polkadot') {
      for (const fields of service.fields) {
        await validatePolkadotConfig(fields);
      }
    } else {
      throw Error(`Service ${configData.service} is not supported yet.`);
    }
  }
};

// Generate service template
const generateServicesTemplate = (servicesName, instances) => {
  const servicesList = servicesName.toString().split(',');
  let template = {};
  template.services = [];
  for (const value of servicesList) {
    if (value === 'polkadot') {
      let service = {};
      service.name = value;
      let fieldsList = {};
      fieldsList.fields = [];
      var i;
      for (i = 0; i < instances; i++) {
        const fields = polkadotFields.map((el) => el.name);
        const fieldsObject = fields.reduce((result, item) => {
          result[item] = '';
          return result;
        }, {});
        fieldsList.fields.push(fieldsObject);
      }
      service = { ...service, ...fieldsList };
      template.services.push(service);
    } else {
      throw Error(`Service ${value} is not supported yet.`);
    }
  }
  return template;
};

// Generate service configuration
const generateServicesConfig = async (configData, federationSize) => {
  const config = {};
  config.services = [];

  for (const serviceData of configData.services) {
    const service = {};
    service.name = serviceData.name;
    if (serviceData.name === 'polkadot') {
      service.fields = await generateServiceFieldsConfig(
        serviceData,
        polkadotFields
      );
      // Generate Service Node Ids
      service.nodeIds = await generateNodeIds(serviceData.name, federationSize);
      // Create reserved peers list
      service.reservedPeersList = await service.nodeIds
        .reduce((listArray, currentValue, currentIndex) => {
          return listArray.concat(
            `/ip4/10.0.1.${currentIndex + 1}/tcp/30333/p2p/${
              currentValue.peerId
            },`
          );
        }, '')
        .slice(0, -1);
    } else {
      throw Error(`Service ${service.name} is not supported yet.`);
    }
    config.services.push(service);
  }
  return config;
};

const generateServiceFieldsConfig = async (serviceData, serviceFields) => {
  const result = [];
  for (const fieldsData of serviceData.fields) {
    const fields = [];
    for (const field of serviceFields) {
      // If service field was set in request
      if (
        fieldsData[field.name] !== undefined &&
        fieldsData[field.name] !== ''
      ) {
        fields.push({
          name: field.name,
          value: fieldsData[field.name],
          env: field.env,
        });
      } else {
        throw Error(`'${field.label}' field was not set.`);
      }
    }
    result.push(fields);
  }
  return result;
};

module.exports = {
  generateServicesConfig,
  validateServicesConfig,
  generateServicesTemplate,
};
