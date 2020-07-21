const {
  execAsync
} = require('./utils');

// Generate Wireguard keys
const generateWireguardKeys = async keysNumber => {
  const keys = [];
  for (let i = 0; i < keysNumber; i++) {
    const key = {};
    const genKeyCmd = await execAsync('wg genkey');
    key.privateKey = genKeyCmd.match(/[A-Za-z0-9+=/]*/).toString();
    const publicKeyCmd = await execAsync(`echo ${key.privateKey} | wg pubkey`);
    key.publicKey = publicKeyCmd.match(/[A-Za-z0-9+=/]*/).toString();

    if (key.privateKey.length === 44 && key.publicKey.length === 44) {
      keys.push(key);
    }
  }
  return keys;
};

// Generate Wireguard configuration
const generateWireguardConfig = async (externalIPAddresses, wireguardPortsList) => {
  const config = {};

  // Add port number to addresses and add to config
  config.wireguardExternalAddrList = externalIPAddresses.map((element, index) => 
    {
      if (wireguardPortsList && wireguardPortsList.length >= index && wireguardPortsList[index]){
        const port = wireguardPortsList[index];
        return `${element}:${port}`
      }
      else{
        return `${element}:51820`
      } 
    } 
  ).join(',');

  // Generate Wireguard keys
  const wireGuardKeys = await generateWireguardKeys(externalIPAddresses.length);

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
