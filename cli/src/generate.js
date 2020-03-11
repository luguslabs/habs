const debug = require('debug')('generate');
const path = require('path');
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

const generateConfig = async (spinner) => {

    try {
        spinner.start();

        // Config file checks
        await prepareTempDirectory(tempDir);

        if (!await fileExists(configFile)) {
            throw Error(`Archipel config file was not found. Try to launch 'init' command.`);
        }

        console.log(`Generating init config file...`);
        let configData = await loadJSONFile(configFile);

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
        await createArchive(tempDir, path.join(process.cwd(), 'config.zip'), '1111');

        console.log(`\nSuccess! Archipel configuration archive was generated!`)
        spinner.stop();

    } catch (error) {
        debug('generateConfig()', error);
        console.log(error);
        spinner.stop();

    }
}

module.exports = {
    generateConfig
}