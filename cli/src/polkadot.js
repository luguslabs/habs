const {
  validateSeed
} = require('./substrate');

// Necessary fields for polkadot service
const polkadotFields = [
  {
    type: 'text',
    name: 'granKey',
    label: 'Gran Key',
    env: 'POLKADOT_KEY_GRAN'
  },
  {
    type: 'text',
    name: 'babeKey',
    label: 'Babe Key',
    env: 'POLKADOT_KEY_BABE'
  },
  {
    type: 'text',
    name: 'imonKey',
    label: 'Imon Key',
    env: 'POLKADOT_KEY_IMON'
  },
  {
    type: 'text',
    name: 'paraKey',
    label: 'Para Key',
    env: 'POLKADOT_KEY_PARA'
  },
  {
    type: 'text',
    name: 'audiKey',
    label: 'Audi Key',
    env: 'POLKADOT_KEY_AUDI'
  }
];

// Validate polkadot service configuration
const validatePolkadotConfig = async configData => {
  // Validate seeds
  if (!await validateSeed(configData.granKey)) {
    throw Error('granKey seed is not valid.');
  }
  if (!await validateSeed(configData.babeKey)) {
    throw Error('babeKey seed is not valid.');
  }
  if (!await validateSeed(configData.imonKey)) {
    throw Error('imonKey seed is not valid.');
  }
  if (!await validateSeed(configData.paraKey)) {
    throw Error('paraKey seed is not valid.');
  }
  if (!await validateSeed(configData.audiKey)) {
    throw Error('audiKey seed is not valid.');
  }
};

module.exports = {
  polkadotFields,
  validatePolkadotConfig
};
