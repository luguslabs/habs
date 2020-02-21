const fs = require('fs');

const {
  execCmdSync,
  asyncMiddleware
} = require('./utils');

const configArchiveName = 'config.zip';
const configFileName = 'config.json';
const tempDir = '/tmp/archipel-join';

exports.joinFederation = asyncMiddleware(async (req, res, next) => {
  // Check if file was set
  if (!req.files) {
    throw new Error('No files uploaded');
  }

  const configFile = req.files.configFile;

  // Move file into temp directory
  await configFile.mv(`${tempDir}/${configArchiveName}`);

  // Unzip file
  unzipFile(`${tempDir}/${configArchiveName}`, `${tempDir}`);

  // Get config data from file
  const fileData = fs.readFileSync(`${tempDir}/${configFileName}`);
  const config = JSON.parse(fileData);

  // Check if node number is correct
  if (req.body.nodeNumber === undefined || req.body.nodeNumber === '') {
    throw new Error('Please set node number');
  }

  if (config.wireGuardKeys.length <= parseInt(req.body.nodeNumber)) {
    throw new Error(`Invalid node number. Configuration file knows only nodes 0..${config.wireGuardKeys.length - 1}`);
  }

  const params = parseConfigObject(config, req.body.nodeNumber);

  startArchipel(params);

  res.send({
    message: 'Archipel federation was bootstrapped'
  });
});

const unzipFile = (file, place) => {
  execCmdSync(`unzip -o ${file} -d ${place}`);
};

const parseConfigObject = (config, nodeNumber) => {
  // This variable is static and will be the same for a 3 nodes federation
  const additionalParams = `--node-key 000000000000000000000000000000000000000000000000000000000000000${nodeNumber + 1} --bootnodes /ip4/10.0.1.1/tcp/30333/p2p/QmRpheLN4JWdAnY7HGJfWFNbfkQCb6tFf4vvA6hgjMZKrR --bootnodes /ip4/10.0.1.2/tcp/30333/p2p/QmSVnNf9HwVMT1Y4cK1P6aoJcEZjmoTXpjKBmAABLMnZEk --bootnodes /ip4/10.0.1.3/tcp/30333/p2p/QmV7EhW6J6KgmNdr558RH1mPx2xGGznW7At4BhXzntRFsi`;

  // Constructing SR Wallets List
  const sr25519List = config.archipelSubstrateKeys.map(element => element.sr25519Address);

  // Constructing Ed Wallets List
  const ed25519List = config.archipelSubstrateKeys.map(element => element.ed25519Address);

  // Constructing Wireguard peers public addresses list
  const peersPubAddrList = config.wireGuardKeys.map(element => element.publicKey);

  // Constructing Wireguard allowed ips list
  const allowedIpsList = [];
  for (let i = 0; i < config.wireGuardKeys.length; i++) {
    allowedIpsList.push(`10.0.1.${i + 1}/32`);
  }

  // Constructing Wireguard external ips addresses list
  const externalAddrList = config.externalIPAddresses.map(element => `${element}:51820`);

  // Constructing result object
  const resultObj = {
    ARCHIPEL_NODE_ALIAS: `${config.name}-${nodeNumber + 1}`,
    ARCHIPEL_KEY_SEED: config.archipelSubstrateKeys[nodeNumber].seed,
    ARCHIPEL_CHAIN_ADDITIONAL_PARAMS: additionalParams,
    ARCHIPEL_AUTHORITIES_SR25519_LIST: sr25519List.join(','),
    ARCHIPEL_AUTHORITIES_ED25519_LIST: ed25519List.join(','),
    WIREGUARD_PRIVATE_KEY: config.wireGuardKeys[nodeNumber].privateKey,
    WIREGUARD_ADDRESS: `10.0.1.${nodeNumber + 1}/32`,
    WIREGUARD_PEERS_PUB_ADDR: peersPubAddrList.join(','),
    WIREGUARD_PEERS_ALLOWED_IP: allowedIpsList.join(','),
    WIREGUARD_PEERS_EXTERNAL_ADDR: externalAddrList.join(','),
    SERVICE: config.service.name
  };

  // Add service env variables
  for (const key in config.service) {
    const value = config.service[key];
    if (value.env) {
      resultObj[value.env] = value.body;
    }
  }

  return resultObj;
};

const startArchipel = params => {
  console.log(params);
};
