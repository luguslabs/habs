const { execAsync } = require('./utils');

// Generate Substrate Keys and extract sr25519 and ed25519 addresses
const generateSubstrateKeys = async (keysNumber) => {
  const keys = [];
  for (let i = 0; i < keysNumber; i++) {
    const key = {};

    const subKeyResult = await execAsync('subkey generate --network substrate');
    key.seed = subKeyResult
      .match(/`.*`/)
      .toString()
      .replace(/`/gi, '')
      .toString();
    key.sr25519Address = subKeyResult
      .match(/SS58 Address:.*/)
      .toString()
      .replace(/SS58 Address: {5}/, '')
      .toString()
      .replace(/\s/g, '')
      .toString();

    const subKeyResultEd = await execAsync(
      `subkey inspect --scheme Ed25519 --network substrate "${key.seed}"`
    );
    key.ed25519Address = subKeyResultEd
      .match(/SS58 Address:.*/)
      .toString()
      .replace(/SS58 Address: {5}/, '')
      .toString()
      .replace(/\s/g, '')
      .toString();
    keys.push(key);
  }
  return keys;
};

// Create Node id files and get PeerIds
const generateNodeIds = async (service, nodesNumber) => {
  const nodeIds = [];

  for (let i = 0; i < nodesNumber; i++) {
    const node = {};
    const subKeyCommand = await execAsync(
      `subkey generate-node-key --file /tmp/archipel-bootstrap/${service}-node-id-${i}`
    );
    const subKeyResult = subKeyCommand.match(/[A-Za-z0-9+=/]*/).toString();
    node.peerId = subKeyResult;
    node.idFile = `${service}-node-id-${i}`;
    nodeIds.push(node);
  }

  return nodeIds;
};

// Validate a seed
const validateSeed = async (seed) => {
  const subKeyCommand = await execAsync(
    `subkey inspect --scheme Ed25519 --network substrate "${seed}"`
  );
  return !subKeyCommand.includes('Invalid');
};

module.exports = {
  generateSubstrateKeys,
  generateNodeIds,
  validateSeed,
};
