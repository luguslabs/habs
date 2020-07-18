const debug = require('debug')('init');
const Spinner = require('clui').Spinner;
const {
  generateServiceTemplate
} = require('./service');

const {
  saveJSONToFile
} = require('./utils');

const configTemplate = {
  name: 'Archipel Name',
  publicIps: '1.1.1.1,2.2.2.2,3.3.3.3,4.4.4.4,5.5.5.5,6.6.6.6',
  nodesRole: 'operator,operator,operator,sentry,sentry,sentry',
  nexmoApiKey :'null,null,null,null,null,null',
  nexmoApiSecret :'null,null,null,null,null,null',
  nexmoPhoneNumber:'null,null,null,null,null,null',
  outletPhoneNumber:'null,null,null,null,null,null'
};

const initConfig = async service => {
  try {
    const spinner = new Spinner('Initializing Archipel CLI config file...');
    spinner.start();

    // Constructing configuration
    const config = { ...configTemplate, ...generateServiceTemplate(service) };

    // Saving config into config file in working directory
    await saveJSONToFile(config, 'archipel.json');

    spinner.stop();
    console.log(`Success! Config file for service '${service}' was initialized!`);
  } catch (error) {
    debug('initConfig()', error);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  initConfig
};
