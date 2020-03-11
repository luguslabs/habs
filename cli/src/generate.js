const debug = require('debug')('generate');
const path = require('path');
const inquirer = require('inquirer');
const {
  loadJSONFile,
  createArchive,
  fileExists,
  prepareTempDirectory,
  saveJSONToPath
} = require('./utils');

const {
  generateServiceConfig
} = require('./service');

const {
  generateWireguardConfig
} = require('./wireguard');

const {
  generateArchipelConfig
} = require('./archipel');

const configFile = 'archipel.json';
const tempDir = '/tmp/archipel-bootstrap';

// Get password from user
const getPasswordFromUser = () => {
  const questions = [
    {
      name: 'password',
      type: 'password',
      message: 'Choose a password to protect Archipel archive:',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter a password.';
        }
      }
    }
  ];
  return inquirer.prompt(questions);
};

const generateConfig = async (spinner) => {
  try {
    // Get archive password password from user
    const password = await getPasswordFromUser();

    spinner.start();

    // Config file checks
    await prepareTempDirectory(tempDir);

    // Check if config file was found
    if (!await fileExists(configFile)) {
      throw Error('Archipel config file was not found. Try to launch \'init\' command.');
    }

    console.log('Generating init config file...');
    const configData = await loadJSONFile(configFile);

    // Start constructing config
    let config = {};

    const externalIPAddresses = configData.publicIps.split(',');

    // Add node number to config
    config.nodesNumber = externalIPAddresses.length;

    config = { ...config, ...await generateServiceConfig(configData, config.nodesNumber) };

    // Adding wireguard config
    config = { ...config, ...await generateWireguardConfig(externalIPAddresses) };

    // Adding Archipel config
    config = { ...config, ...await generateArchipelConfig(config.nodesNumber) };

    // Write configuration to file
    await saveJSONToPath(config, `${tempDir}/config.json`);

    // Creating configuration archive
    await createArchive(tempDir, path.join(process.cwd(), 'config.zip'), password.password);

    spinner.stop();
    console.log('Success! Archipel configuration archive was generated!');
  } catch (error) {
    spinner.stop();
    debug('generateConfig()', error);
    console.log(error);
    process.exit(1);
  }
};

module.exports = {
  generateConfig
};
