const {
  validateSeed
} = require('./substrate');

// Necessary fields for polkadot service
const polkadotFields = [
    {
      type: 'text',
      name: 'granKey',
      label: 'Gran Key',
      env: 'POLKADOT_KEY_GRAN',
    },
    {
      type: 'text',
      name: 'babeKey',
      label: 'Babe Key',
      env: 'POLKADOT_KEY_BABE',
    },
    {
      type: 'text',
      name: 'imonKey',
      label: 'Imon Key',
      env: 'POLKADOT_KEY_IMON',
    },
    {
      type: 'text',
      name: 'paraKey',
      label: 'Para Key',
      env: 'POLKADOT_KEY_PARA',
    },
    {
      type: 'text',
      name: 'asgnKey',
      label: 'Asgn Key',
      env: 'POLKADOT_KEY_ASGN',
    },
    {
      type: 'text',
      name: 'audiKey',
      label: 'Audi Key',
      env: 'POLKADOT_KEY_AUDI',
    },
  ];

  // Validate polkadot service configuration
const validatePolkadotConfig = async fieldData => {
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
  if (!await validateSeed(fieldData.paraKey)) {
    throw Error('paraKey seed is not valid.');
  }
  if (!await validateSeed(fieldData.asgnKey)) {
    throw Error('asgnKey seed is not valid.');
  }
  if (!await validateSeed(fieldData.audiKey)) {
    throw Error('audiKey seed is not valid.');
  }
};

module.exports = {
  polkadotFields,
  validatePolkadotConfig
};
