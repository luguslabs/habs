const path = require('path');

const { 
    existsAsync, 
    asyncMiddleware,
    rootDir,
    unlinkAsync,
    writeFileAsync
} = require('./utils');

const Service = require('./service');

const configFile = "config.zip";
const configFilePath = path.join(rootDir, "public", configFile); 

exports.getConfig = asyncMiddleware(async (req, res, next) => {
    const fileExists = await existsAsync(configFilePath);
    if (!fileExists) {
        throw new Error('Configuration file was not found');
    } else {
        res.redirect(configFile);
    }
});

exports.deleteConfig = asyncMiddleware(async (req, res, next) => {
    const fileExists = await existsAsync(configFilePath);
    if (!fileExists) {
        throw new Error('Configuration file was not found');
    } else {
        await unlinkAsync(configFilePath);
        res.status(200).json({
            message: 'Configuration file was deleted'
        });
    }
});

exports.generateConfig = asyncMiddleware(async (req, res, next) => {
    const fileExists = await existsAsync(configFilePath);
    if (!fileExists) {
        let config = null;
        const services = await Service.getServices();

        services.forEach(service => {
            if (service.name === req.body.service) {
                config = { name: req.body.service };
                service.fields.forEach(field => {
                if (req.body[field.name] !== undefined && req.body[field.name] !== '') {
                    config[field.name] = req.body[field.name];
                } else {
                    throw Error(`'${field.label}' field was not set.`);
                }
                });
            }
        });

        // Writing JSON to file
        await writeFileAsync(configFilePath, JSON.stringify(config), 'utf8');

        if (config !== null) {
            res.status(200).json({
                message: 'Config file was created'
            });
        } else {
            throw new Error(`Service ${req.body.service} was not found`);
        }
    } else {
        throw new Error('Config file already exists');
    }
});