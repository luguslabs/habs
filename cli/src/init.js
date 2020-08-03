const debug = require('debug')('init');
const Spinner = require('clui').Spinner;
const {
  generateServicesTemplate
} = require('./service');

const {
  saveJSONToFile
} = require('./utils');

const configTemplate = {
  name: 'Archipel',
  publicIps: '1.1.1.1,2.2.2.2,3.3.3.3,4.4.4.4,5.5.5.5,6.6.6.6,7.7.7.7,8.8.8.8,9.9.9.9,10.10.10.10,11.11.11.11,12.12.12.12,13.13.13.13',
  wireguardPorts : '51820,51820,51820,51820,51820,51820,51820,51821,51821,51821,51822,51822,51822',
  nodesRole: 'sentryExternal,sentryExternal,sentryExternal,sentryExternal,operator,operator,operator,operator,operator,operator,operator,operator,operator',
  nodesGroupId:'0,0,0,0,1,1,1,2,2,2,3,3,3',
  nodesGroup:'ext,ext,ext,ext,A,A,A,B,B,B,C,C,C',
  nexmoApiKey :'null,null,null,null,null,null,null,null,null,null,null,null,null',
  nexmoApiSecret :'null,null,null,null,null,null,null,null,null,null,null,null,null',
  nexmoApiSignatureMethod:'null,null,null,null,null,null,null,null,null,null,null,null,null',
  nexmoApiSignatureSecret:'null,null,null,null,null,null,null,null,null,null,null,null,null',
  nexmoPhoneNumber:'null,null,null,null,null,null,null,null,null,null,null,null,null',
  outletPhoneNumber:'null,null,null,null,null,null,null,null,null,null,null,null,null'
};

const initConfig = async services => {
  try {
    const spinner = new Spinner('Initializing Archipel CLI config file...');
    spinner.start();

    // Constructing configuration
    const config = { ...configTemplate, ...generateServicesTemplate(services, 13) };

    // Saving config into config file in working directory
    await saveJSONToFile(config, 'archipel.json');

    spinner.stop();
    console.log(`Success! Config file for service '${services}' was initialized!`);
  } catch (error) {
    debug('initConfig()', error);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  initConfig
};
