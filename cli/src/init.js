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

        let config = {...configTemplate};

        const serviceObject = getService(service);

        if (serviceObject) {
            config['service'] = service;
            const fields = serviceObject.fields.map(el => el.name);

            const fieldsObject = fields.reduce((result, item) => {
                result[item] = ''
                return result;
            }, {});

            config = {...config, ...fieldsObject}
        } else {
            throw Error(`Service ${service} is not supported yet.`)
        }

        await saveJSONToFile(config, 'archipel.json');
        spinner.stop();

        console.log(`\nSuccess! Config file for service '${service}' was initialized!`);
    } catch (error) {
        spinner.stop();
        debug('initConfig()', error);
        console.error(error);
    }
}

module.exports = {
    initConfig
}
