const {
  execCmdSync
} = require('./utils');

// Generate Wireguard keys
const generateWireguardKeys = keysNumber => {
  const keys = [];
  for (let i = 0; i < keysNumber; i++) {
    const key = {};
    key.privateKey = execCmdSync('wg genkey').match(/[A-Za-z0-9+=/]*/).toString();
    key.publicKey = execCmdSync(`echo ${key.privateKey} | wg pubkey`).match(/[A-Za-z0-9+=/]*/).toString();

    if (key.privateKey.length === 44 && key.publicKey.length === 44) {
      keys.push(key);
    }
  }
  return keys;
};

// Generate Wireguard configuration
const generateWireguardConfig = externalIPAddresses => {
  const config = {};

  // Add port number to addresses and add to config
  config.wireguardExternalAddrList = externalIPAddresses.map(element => `${element}:51820`).join(',');

  // Generate Wireguard keys
  const wireGuardKeys = generateWireguardKeys(externalIPAddresses.length);

  // Constructing Wireguard peers public addresses list
  config.wireguardPeersPubAddrList = wireGuardKeys.map(element => element.publicKey).join(',');

  // Fill allowedIpsList and nodes private addresses
  const wireguardAllowedIpsList = [];
  config.wireguardNodes = [];
  for (let i = 0; i < externalIPAddresses.length; i++) {
    config.wireguardNodes.push({ privateKey: wireGuardKeys[i].privateKey });
    wireguardAllowedIpsList.push(`10.0.1.${i + 1}/32`);
  }

  config.wireguardAllowedIpsList = wireguardAllowedIpsList.join(',');

  return config;
};

module.exports = {
  generateWireguardConfig
};
