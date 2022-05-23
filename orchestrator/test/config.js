/* eslint-disable */
const { arrayFilter } = require('@polkadot/util');
const { assert } = require('chai');

const {
    constructConfiguration
} = require("../src/config");

// Test configuration
const testTimeout = 60000;

// Env variables

describe('Config test', function () {
    this.timeout(testTimeout);

    after(() => {
        delete process.env.CONFIG_FILE;
        delete process.env.CONFIG_FILE_PATH;
        delete process.env.NODE_ID;
        delete process.env.NODE_WS;
        delete process.env.ALIVE_TIME;
        delete process.env.SERVICES;
        delete process.env.ARCHIPEL_SERVICE_MODE;
        delete process.env.ARCHIPEL_NAME;
        delete process.env.NODE_GROUP_ID;
        delete process.env.MNEMONIC;
        delete process.env.NODES_WALLETS;
        delete process.env.NODE_ROLE;
        delete process.env.ARCHIPEL_HEARTBEATS_ENABLE;
        delete process.env.ARCHIPEL_ORCHESTRATION_ENABLE;
    });
  
    it('Test config generation from minimal env variables', async () => {
        // Set env variables
        process.env.MNEMONIC = 'toto titi toto';
        process.env.NODES_WALLETS = '0x1,0x2,0x3';

        // Config must be
        const config = {
            nodeRole: 'operator',
            mnemonic: 'toto titi toto',
            nodesWallets: '0x1,0x2,0x3',
            archipelName: 'test-archipel',
            nodeGroupId: 1,
            nodeWs: 'ws://127.0.0.1:9944',
            aliveTime: 12,
            heartbeatEnabled: true,
            orchestrationEnabled: true,
            service: 'polkadot',
            serviceMode: 'orchestrator',
            serviceDataDirectory: '/service',
            serviceConfigDirectory: '/config'
        };

        // Constructing configuration
        const generatedConfig = constructConfiguration();

        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });

    it('Test config generation from full env variables', async () => {
        // Set env variables
        process.env.NODE_WS = 'ws://127.0.0.8/';
        process.env.ALIVE_TIME = '50';
        process.env.SERVICES = 'polkashot';
        process.env.ARCHIPEL_SERVICE_MODE = 'passive';
        process.env.ARCHIPEL_NAME = 'real-archipel';
        process.env.NODE_GROUP_ID = '42';
        process.env.MNEMONIC = 'toto titi toto';
        process.env.NODES_WALLETS = '0x1,0x2,0x3';
        process.env.NODE_ROLE = 'operator';
        process.env.ARCHIPEL_HEARTBEATS_ENABLE = 'false';
        process.env.ARCHIPEL_ORCHESTRATION_ENABLE = 'false';

        // Config must be
        const config = {
            nodeRole: 'operator',
            mnemonic: 'toto titi toto',
            nodesWallets: '0x1,0x2,0x3',
            archipelName: 'real-archipel',
            nodeGroupId: 42,
            nodeWs: 'ws://127.0.0.8/',
            aliveTime: 50,
            heartbeatEnabled: false,
            orchestrationEnabled: false,
            service: 'polkashot',
            serviceMode: 'passive',
            serviceDataDirectory: '/service',
            serviceConfigDirectory: '/config'
        };

        // Constructing configuration
        const generatedConfig = constructConfiguration();

        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });

    it('Test config generation from full env variables no service', async () => {
        // Set env variables
        process.env.NODE_WS = 'ws://127.0.0.8/';
        process.env.ALIVE_TIME = '50';
        process.env.ARCHIPEL_NAME = 'real-archipel';
        process.env.NODE_GROUP_ID = '42';
        process.env.MNEMONIC = 'toto titi toto';
        process.env.NODES_WALLETS = '0x1,0x2,0x3';
        process.env.NODE_ROLE = 'noservice';
        process.env.ARCHIPEL_HEARTBEATS_ENABLE = 'false';
        process.env.ARCHIPEL_ORCHESTRATION_ENABLE = 'false';

        // Config must be
        const config = {
            nodeRole: 'noservice',
            mnemonic: 'toto titi toto',
            nodesWallets: '0x1,0x2,0x3',
            archipelName: 'real-archipel',
            nodeGroupId: 42,
            nodeWs: 'ws://127.0.0.8/',
            aliveTime: 50,
            heartbeatEnabled: false,
            orchestrationEnabled: false
        };

        // Constructing configuration
        const generatedConfig = constructConfiguration();

        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });

    it('Test config generation with wrong alive time and nodeGroupId', async () => {
        // Set env variables
        process.env.MNEMONIC = 'toto titi toto';
        process.env.NODES_WALLETS = '0x1,0x2,0x3';
        process.env.ALIVE_TIME = 'notandinteger';
        process.env.NODE_GROUP_ID = 'notandinteger';

        try{
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Alive time must be an integer', 'Check error trigger if alive time is not an integer');
        }

        process.env.ALIVE_TIME = '50';

        try{
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Node group id must be an integer', 'Check error trigger if node group id is not an integer');
        }
    });

    it('Test hearbeat send and orchestration enabled if any value except false', async () => {
        // Set env variables
        process.env.NODE_WS = 'ws://127.0.0.8/';
        process.env.ALIVE_TIME = '50';
        process.env.SERVICES = 'polkashot';
        process.env.ARCHIPEL_SERVICE_MODE = 'passive';
        process.env.ARCHIPEL_NAME = 'real-archipel';
        process.env.NODE_GROUP_ID = '42';
        process.env.MNEMONIC = 'toto titi toto';
        process.env.NODES_WALLETS = '0x1,0x2,0x3';
        process.env.NODE_ROLE = 'operator';
        process.env.ARCHIPEL_HEARTBEATS_ENABLE = 'toto';
        process.env.ARCHIPEL_ORCHESTRATION_ENABLE = 'toto';

        // Config must be
        const config = {
            nodeRole: 'operator',
            mnemonic: 'toto titi toto',
            nodesWallets: '0x1,0x2,0x3',
            archipelName: 'real-archipel',
            nodeGroupId: 42,
            nodeWs: 'ws://127.0.0.8/',
            aliveTime: 50,
            heartbeatEnabled: true,
            orchestrationEnabled: true,
            service: 'polkashot',
            serviceMode: 'passive',
            serviceDataDirectory: '/service',
            serviceConfigDirectory: '/config'
        };

        const generatedConfig = constructConfiguration();
        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });

    it('Test load operator config from configuration file', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = '1';
        process.env.NODE_WS = 'ws://127.0.0.8/';
        process.env.ALIVE_TIME = '50';
        process.env.ARCHIPEL_SERVICE_MODE = 'passive';

        // Config must be
        const config = {
            nodeId: 1,
            configFilePath: './test/mock-config.json',
            nodeRole: 'operator',
            mnemonic: 'wrong media admit arrange image genuine cement cannon donor ranch number hammer',
            nodesWallets: '5GukhqQ4gVspJk2CckH9Hqd4UnKtc8DzUWsfuD7L4A43d8hp,5DfFAjZV9gTVo1xmQFvreC4KLhkp8W7MfLnxw4XZifEPyL7L,5Ek9C71aaEi1YtqgSmZfaC9UXYRxUeS95MSrzehPUpXK5brb,5FsStWpfyVMX29GBvzi3h6HRzoTZi76F8U4PZJqvtKdpftz1,5FxVdGGzSZYhThrnPs9hMepGNmtn4G29MS8eEs4XrGugMyYe,5Gzn3mQogz7X4G6GfzaVa51GYJ4AzPS6CZJMukSqWkgmSvNE,5HmxRRN9DAQDz9JvZaw8Z8qgQvkNk6w6EJwsW9EwT1imBW6P,5CAULNfnnoJ1Ua7PqZ2NL2mkNMa73CQ8HQB4JJdGhfuK6398,5FP8VC7bHCPXuuShV8cjPyu3CxGDj8KTQb7kB19X3f9wATnb,5CctGfiDrnSELKTedsSbadXAb7XteoSQLPPuYCaAH1mgg7mk,5DqQWqfuQWLkG9Di6PRSSzpRVZz1teAC1kypR4rrqWQVggry,5CJC5GXbgG7SEPsH6MsDe4afrB7NJs7EC2pQRSSP7zFqUNJY,5FgjJmrEpACCCFQTYuFLwxQSk9yNQjeebzWUc3QAM2Hr12bJ',
            archipelName: 'archipel',
            nodeGroupId: 1,
            service: 'polkadot',
            nodeWs: 'ws://127.0.0.8/',
            aliveTime: 50,
            heartbeatEnabled: true,
            orchestrationEnabled: true,
            serviceMode: 'passive',
            serviceDataDirectory: '/service',
            serviceConfigDirectory: '/config'
        };
        
        const generatedConfig = constructConfiguration();
        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });

    it('Test load operator config from configuration file for no service', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = '12';
        process.env.NODE_WS = 'ws://127.0.0.8/';
        process.env.ALIVE_TIME = '50';

        // Config must be
        const config = {
            nodeId: 12,
            configFilePath: './test/mock-config.json',
            nodeRole: 'noservice',
            mnemonic: 'phrase crater online coast zoo glance ignore undo boss region tuna chest',
            nodesWallets: '5GukhqQ4gVspJk2CckH9Hqd4UnKtc8DzUWsfuD7L4A43d8hp,5DfFAjZV9gTVo1xmQFvreC4KLhkp8W7MfLnxw4XZifEPyL7L,5Ek9C71aaEi1YtqgSmZfaC9UXYRxUeS95MSrzehPUpXK5brb,5FsStWpfyVMX29GBvzi3h6HRzoTZi76F8U4PZJqvtKdpftz1,5FxVdGGzSZYhThrnPs9hMepGNmtn4G29MS8eEs4XrGugMyYe,5Gzn3mQogz7X4G6GfzaVa51GYJ4AzPS6CZJMukSqWkgmSvNE,5HmxRRN9DAQDz9JvZaw8Z8qgQvkNk6w6EJwsW9EwT1imBW6P,5CAULNfnnoJ1Ua7PqZ2NL2mkNMa73CQ8HQB4JJdGhfuK6398,5FP8VC7bHCPXuuShV8cjPyu3CxGDj8KTQb7kB19X3f9wATnb,5CctGfiDrnSELKTedsSbadXAb7XteoSQLPPuYCaAH1mgg7mk,5DqQWqfuQWLkG9Di6PRSSzpRVZz1teAC1kypR4rrqWQVggry,5CJC5GXbgG7SEPsH6MsDe4afrB7NJs7EC2pQRSSP7zFqUNJY,5FgjJmrEpACCCFQTYuFLwxQSk9yNQjeebzWUc3QAM2Hr12bJ',
            archipelName: 'archipel',
            nodeGroupId: 99,
            nodeWs: 'ws://127.0.0.8/',
            aliveTime: 50,
            heartbeatEnabled: true,
            orchestrationEnabled: true
        };
        
        const generatedConfig = constructConfiguration();
        assert.equal(JSON.stringify(generatedConfig), JSON.stringify(config), 'Check if configuration was generated correctly');
    });


    it('Test wrong node config from configuration file', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = '99';

        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Error: Invalid node id. It must be between 1 and 13. Please check config file.', 'Check if error was raised if bad node id');
        }

    });

    it('Test if node id is not an integer', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = 'sdsd';

        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Node id must be set and must be an integer', 'Check if error was raised if node id is not an integer');
        }
    });

    it('Test with wrong configuration file', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config-empty.json';
        process.env.NODE_ID = '1';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), `Error: TypeError: Cannot read property 'split' of undefined. Please check config file.`, 'Check if error was raised if cant read some properties from config file');
        }
    });

    it('Test if no config file was set', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        delete process.env.CONFIG_FILE_PATH;
        process.env.NODE_ID = '1';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), `Error: ENOENT: no such file or directory, open '/config/config.json'`, 'Check if error was raised if cant read some properties from config file');
        }
    });
});