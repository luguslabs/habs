const {
  validateSeed
} = require('./substrate');

// Necessary fields for polkadot service
const centrifugeFields = [
    {
      type: 'text',
      name: 'granKey',
      label: 'Gran Key',
      env: 'CENTRIFUGE_KEY_GRAN',
    },
    {
      type: 'text',
      name: 'babeKey',
      label: 'Babe Key',
      env: 'CENTRIFUGE_KEY_BABE',
    },
    {
      type: 'text',
      name: 'imonKey',
      label: 'Imon Key',
      env: 'CENTRIFUGE_KEY_IMON',
    },
    {
      type: 'text',
      name: 'audiKey',
      label: 'Audi Key',
      env: 'CENTRIFUGE_KEY_AUDI',
    },
  ];

  // Validate CENTRIFUGE service configuration
const validateCentrifugeConfig = async fieldData => {
  // Validate seeds
  if (!await validateSeed(fieldData.granKey)) {
    throw Error('granKey seed is not valid.');
  }
  if (!await validateSeed(fieldData.babeKey)) {
    throw Error('babeKey seed is not valid.');
  }
  if (!await validateSeed(fieldData.imonKey)) {
    throw Error('imonKey seed is not valid.');
  }
  if (!await validateSeed(fieldData.audiKey)) {
    throw Error('audiKey seed is not valid.');
  }
};

module.exports = {
  centrifugeFields,
  validateCentrifugeConfig
};
