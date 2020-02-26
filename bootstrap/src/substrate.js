const {
  execCmdSync
} = require('./utils');

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

// Create Node id files and get PeerIds
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

module.exports = {
  generateSubstrateKeys,
  generateNodeIds
};
