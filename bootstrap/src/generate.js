const path = require('path');

const { 
    existsAsync, 
    asyncMiddleware,
    rootDir,
    unlinkAsync,
    writeFileAsync,
    execAsync
} = require('./utils');

const Service = require('./service');

const configFile = "config.zip";
const configFilePath = path.join(rootDir, "public", configFile); 

exports.getConfig = asyncMiddleware(async (req, res, next) => {
    const fileExists = await existsAsync(configFilePath);
    const wireguardKeys = await generateWireguardKeys(5);
    console.log(`wireguardKeys: ${wireguardKeys}`);
    const substrateKeys = await generateSubstrateKeys(5);
    console.log(`substrateKeys ${substrateKeys}`)

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

const generateWireguardKeys = async keysNumber => {
    const keys = [];
    for(let i = 0; i < keysNumber; i++){
        const key = {};
        key.privateKey = (await execAsync("wg genkey")).match(/[A-Za-z0-9\+\=\/]*/).toString();
        key.publicKey = (await execAsync(`echo ${key.privateKey} | wg pubkey`)).match(/[A-Za-z0-9\+\=\/]*/).toString();
        if (key.privateKey.length === 44 && key.publicKey.length === 44) {
            keys.push(key);
        }
    }
    return keys;
}

const generateSubstrateKeys = async keysNumber => {
    const keys = [];
    for(let i = 0; i < keysNumber; i++) {
        const key = {};
        const subKeyResult = await execAsync("subkey -n substrate generate");
        key.seed = subKeyResult.match(/`.*`/).toString().replace(/`/gi, '').toString();
        key.sr25519Address = subKeyResult.match(/SS58 Address:.*/).toString().replace(/SS58 Address:     /,'').toString();
        const subKeyResultEd = await execAsync(`subkey -n substrate --ed25519 inspect "${key.seed}"`);
        key.ed25519Address = subKeyResultEd.match(/SS58 Address:.*/).toString().replace(/SS58 Address:     /,'').toString();
        keys.push(key);
    }
    return keys;
}

const generateNodeIds = async nodesNumber => {
    
}

// Node ids 3 
// config.json