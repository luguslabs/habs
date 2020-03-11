const debug = require('debug')('init');
const {
    getService
} = require('./service');

const {
    saveJSONToFile
} = require('./utils');

const configTemplate = {
    name: "Archipel Name",
    publicIps: "1.1.1.1,2.2.2.2,3.3.3.3"
};

const initConfig = async (service, spinner) => {

    try {
        spinner.start();

        // Starting config construction from template
        let config = {...configTemplate};

        // Get service and its fields from services.json
        const serviceObject = getService(service);

        // Throw if service was not found in services.json
        if (!serviceObject) {
            throw Error(`Service ${service} is not supported yet.`);
        }

        config['service'] = service;

        // Get service fields and convert into object keys
        const fields = serviceObject.fields.map(el => el.name);
        const fieldsObject = fields.reduce((result, item) => {
            result[item] = ''
            return result;
        }, {});

        // Add service fields into config
        config = {...config, ...fieldsObject}

        // Saving config into config file in working directory
        await saveJSONToFile(config, 'archipel.json');

        spinner.stop();        
        console.log(`Success! Config file for service '${service}' was initialized!`);
    } catch (error) {
        spinner.stop();
        debug('initConfig()', error);
        console.error(error);
        process.exit(1);
    }
}

module.exports = {
    initConfig
}
