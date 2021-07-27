/* eslint-disable */
const { assert } = require('chai');
const os = require('os');
const { Docker } = require('../src/docker');
const { Polkadot } = require('../src/services/polkadot/polkadot');
const { constructConfiguration } = require('../src/services/polkadot/config');

// Set env variables
process.env.POLKADOT_NAME = 'validator-test';
process.env.POLKADOT_PREFIX = 'validatortest-';
process.env.POLKADOT_IMAGE = 'parity/polkadot:latest';
process.env.POLKADOT_KEY_GRAN = 'april shift pupil quit mandate school cost oven gospel castle brain student';
process.env.POLKADOT_KEY_BABE = 'region run sunset rule light gap cool element angle example laundry stadium';
process.env.POLKADOT_KEY_IMON = 'screen sustain clog husband assist noble artist sea fringe afford coil hawk';
process.env.POLKADOT_KEY_PARA = 'produce hover hurdle lobster december slight hat note quit bomb drama notice';
process.env.POLKADOT_KEY_ASGN = 'rough open marine belt rib violin december gesture word fall catalog side';
process.env.POLKADOT_KEY_AUDI = 'oak tail stomach fluid trade aunt fire fringe mercy roast style garlic';
process.env.POLKADOT_ADDITIONAL_OPTIONS = '--chain kusama --db-cache 512';
process.env.TESTING = 'true';

// Variables
let polkadot;
let docker;

// Test configuration
const testTimeout = 360000;

describe('Orchestrator test', function() {
    this.timeout(testTimeout);
  
    before(async () => {
        polkadot = new Polkadot();
        docker = new Docker();
    });

    it('Check polkadot construct configuration from env vars', async () => {
        const config = constructConfiguration();

        const configMustBe = {
            polkadotUnixUserId: 1000,
            polkadotUnixGroupId: 1000,
            polkadotRpcPort: 9993,
            polkadotName: process.env.POLKADOT_NAME,
            polkadotImage: process.env.POLKADOT_IMAGE,
            polkadotPrefix: process.env.POLKADOT_PREFIX,
            polkadotKeyGran: process.env.POLKADOT_KEY_GRAN,
            polkadotKeyBabe: process.env.POLKADOT_KEY_BABE,
            polkadotKeyImon: process.env.POLKADOT_KEY_IMON,
            polkadotKeyPara: process.env.POLKADOT_KEY_PARA,
            polkadotKeyAsgn: process.env.POLKADOT_KEY_ASGN,
            polkadotKeyAudi: process.env.POLKADOT_KEY_AUDI,
            polkadotValidatorName: undefined,
            polkadotReservedNodes: undefined,
            polkadotTelemetryUrl: undefined,
            polkadotNodeKeyFile: undefined,
            polkadotAdditionalOptions: process.env.POLKADOT_ADDITIONAL_OPTIONS,
            databasePath: '/polkadot/.local/share/polkadot/chains',
            polkadotSessionKeyToCheck: undefined,
            polkadotSimulateSynch: false,
            testing: process.env.TESTING === 'true',
        };

        assert.equal(JSON.stringify(config), JSON.stringify(configMustBe), 'Check if configuration was constructed correctly');
    });

    it('Check polkadot construct configuration from config file', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = '1';
        process.env.POLKADOT_SIMULATE_SYNCH = 'true';

        const saveValidatorPrefix = process.env.POLKADOT_PREFIX;
        delete process.env.POLKADOT_PREFIX;

        const saveAddOpts = process.env.POLKADOT_ADDITIONAL_OPTIONS;
        delete process.env.POLKADOT_ADDITIONAL_OPTIONS;

        const saveTesting = process.env.TESTING;
        delete process.env.TESTING;

        const savePolkadotImage = process.env.POLKADOT_IMAGE;
        delete process.env.POLKADOT_IMAGE;

        const config = constructConfiguration();

        const configMustBe = {
            nodeId: 1,
            configFilePath: './test/mock-config.json',
            polkadotName: 'archipel-node-1',
            polkadotKeyGran: 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud',
            polkadotKeyBabe: 'ladder mushroom bomb tornado clown wife bean creek axis flat pave cloud',
            polkadotKeyImon: 'bomb mushroom ladder tornado clown wife bean creek axis flat pave cloud',
            polkadotKeyPara: 'tornado mushroom ladder bomb clown wife bean creek axis flat pave cloud',
            polkadotKeyAsgn: 'clown mushroom ladder bomb tornado wife bean creek axis flat pave cloud',
            polkadotKeyAudi: 'wife mushroom ladder bomb tornado clown bean creek axis flat pave cloud',
            polkadotReservedNodes: undefined,
            polkadotNodeKeyFile: undefined,
            polkadotUnixUserId: 1000,
            polkadotUnixGroupId: 1000,
            polkadotRpcPort: 9993,
            polkadotImage: 'parity/polkadot:latest',
            polkadotPrefix: 'node-',
            polkadotValidatorName: undefined,
            polkadotTelemetryUrl: undefined,
            polkadotAdditionalOptions: undefined,
            databasePath: '/polkadot/.local/share/polkadot/chains',
            polkadotSessionKeyToCheck: undefined,
            polkadotSimulateSynch: true,
            testing: false
        };

        assert.equal(JSON.stringify(config), JSON.stringify(configMustBe), 'Check if configuration was constructed correctly');

        process.env.POLKADOT_PREFIX = saveValidatorPrefix;
        process.env.POLKADOT_ADDITIONAL_OPTIONS = saveAddOpts;
        process.env.TESTING = saveTesting;
        process.env.POLKADOT_IMAGE = savePolkadotImage;
        delete process.env.POLKADOT_SIMULATE_SYNCH;
    });

    it('Check polkadot construct configuration from config file fails', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = '99';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Error: Invalid node id. It must be between 1 and 13. Please check config file.', 'Check if node id error was triggered');
        }
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config.json';
        process.env.NODE_ID = 'sdsd';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Node id must be set and must be an integer', 'Check if error was raised if node id is not an integer');
        }
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        process.env.CONFIG_FILE_PATH = './test/mock-config-empty.json';
        process.env.NODE_ID = '1';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), `Error: TypeError: Cannot read property '0' of undefined. Please check config file.`, 'Check if error was thrown if config file is not correct');
        }
    });

    it('Check some default values for variables', async () => {
        // Set env variables
        process.env.CONFIG_FILE = 'true';
        delete process.env.CONFIG_FILE_PATH;
        process.env.NODE_ID = '1';
        try {
            constructConfiguration();
        } catch (error) {
            assert.equal(error.toString(), `Error: ENOENT: no such file or directory, open '/config/config.json'`, 'Check if default config file was not found');
        }
    });


    it('Test import keys functionality', async () => {
        await polkadot.start('active');

        // Test imported keys
        let mustBeImportedKeys = [
            '0xa588f6cd3f7a970a9ebf2b5a7c10dc4e5c8cd3b5fc5dbd29955538d8d2b045d8',
            '0x8ee8898041d849ac9e8d9967a98555f54f7664376c5df55e1429f0d8545d6002',
            '0xe86d86b9e0f53ded99ac69a92cd66c2ccc224b63ec278afa1c6432619a764c2a',
            '0xf8e2f01f36176af753773aaf83685858b7a5314108ab5283601f73dc8c0b726a',
            '0xe4b3843690cc86b6583c44817044a4dda2dfa82bc1b26801fbef33be011e8364',
            '0x9ad38069449ccbe42ad74dc8db390b4fc1adce5f1e8e59504dfee5ae6eb8a20e'
        ];
        assert.equal(JSON.stringify(polkadot.importedKeys), JSON.stringify(mustBeImportedKeys), 'check if keys where imported correctly');

        // Try to reimport existing keys
        let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        let importKey = await polkadot.importKey(containerName, process.env.POLKADOT_KEY_GRAN, 'ed25519', 'gran');
        assert.equal(importKey, false, 'check if trying to import already imported key the function returns false');

        // The curl command to import keys fails
        const savePolkadotRpcPort = polkadot.config.polkadotRpcPort;
        polkadot.config.polkadotRpcPort = 1234;
        importKey = await polkadot.importKey(containerName, 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud', 'ed25519', 'gran');
        assert.equal(importKey, false, 'check if import command fails the function returns false');
        polkadot.config.polkadotRpcPort = savePolkadotRpcPort;

        // Test if check key added command fails
        const saveDatabasePath = polkadot.config.databasePath;
        polkadot.config.databasePath = '/toto';
        importKey = await polkadot.importKey(containerName, 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud', 'ed25519', 'gran');
        assert.equal(importKey, false, 'check if check command fails the function returns false');
        polkadot.config.databasePath = saveDatabasePath;

        // Finally check successfull add
        importKey = await polkadot.importKey(containerName, 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud', 'ed25519', 'gran');
        assert.equal(importKey, true, 'check if import key command returns true');
        mustBeImportedKeys = [
            '0xa588f6cd3f7a970a9ebf2b5a7c10dc4e5c8cd3b5fc5dbd29955538d8d2b045d8',
            '0x8ee8898041d849ac9e8d9967a98555f54f7664376c5df55e1429f0d8545d6002',
            '0xe86d86b9e0f53ded99ac69a92cd66c2ccc224b63ec278afa1c6432619a764c2a',
            '0xf8e2f01f36176af753773aaf83685858b7a5314108ab5283601f73dc8c0b726a',
            '0xe4b3843690cc86b6583c44817044a4dda2dfa82bc1b26801fbef33be011e8364',
            '0x9ad38069449ccbe42ad74dc8db390b4fc1adce5f1e8e59504dfee5ae6eb8a20e',
            '0x9c1e71dc004b8bd118f479051b85bf4c7afd256df7883a94c3fbf96fc8b3513b'
        ];
        assert.equal(JSON.stringify(polkadot.importedKeys), JSON.stringify(mustBeImportedKeys), 'check if keys where imported correctly');

        // Trying to relaunch all processus of key addition
        const importAllKeys = await polkadot.polkadotKeysImport(containerName);
        assert.equal(importAllKeys, false, 'check if keys import returns false cause there is more than 6 keys already in the keystore');

        polkadot.importedKeys = [];
        await polkadot.cleanUp();
    });

    it('Test if service ready to start functionality', async () => {

        let serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready if container is not launched');

        // Launching service and testing
        await polkadot.start('active');

        // Forcing polkadotSimulateSynch
        const saveSimulateSynch = polkadot.config.polkadotSimulateSynch;
        polkadot.config.polkadotSimulateSynch = true;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, true, 'check if service is ready when simulate synch is set');
        polkadot.config.polkadotSimulateSynch = saveSimulateSynch;

        // Fail system health get
        const saveRpcPort = polkadot.config.polkadotRpcPort;
        polkadot.config.polkadotRpcPort = 1234;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready cause system health get fails');
        polkadot.config.polkadotRpcPort = saveRpcPort;

        // Mock system health get
        const saveDockerExecute = polkadot.docker.dockerExecute;

        let systemHealthGetResult = `{"jsonrpc":"2.0","result":{"isSyncing":true,"shouldHavePeers":true},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready cause peers info is not available');

        systemHealthGetResult = `{"jsonrpc":"2.0","result":{"isSyncing":true,"peers":0,"shouldHavePeers":true},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready cause connected to zero peers');

        systemHealthGetResult = `{"jsonrpc":"2.0","result":{"isSyncing":true,"peers":20,"shouldHavePeers":true},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready cause is synching is true');

        systemHealthGetResult = `{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":20,"shouldHavePeers":true},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, true, 'check if service is ready');

        polkadot.docker.dockerExecute = saveDockerExecute;

        polkadot.importedKeys = [];
        await polkadot.cleanUp();
    });

    it('Check launched container functionality', async () => {
        let checkLaunchedContainer = await polkadot.checkLaunchedContainer();
        assert.equal(checkLaunchedContainer, 'none', 'check if function returns none is no container launched');

        // Launching service and testing
        await polkadot.start('active');

        checkLaunchedContainer = await polkadot.checkLaunchedContainer();
        assert.equal(checkLaunchedContainer, 'active', 'check if function returns that active container was launched');

        // Launching service and testing
        await polkadot.start('passive');

        checkLaunchedContainer = await polkadot.checkLaunchedContainer();
        assert.equal(checkLaunchedContainer, 'passive', 'check if function returns that passive container was launched');

        polkadot.importedKeys = [];
        await polkadot.cleanUp();
    });

    it('Test prepare service function', async () => {

        const saveCommonPolkadotOpts = polkadot.commonPolkadotOptions;
        const saveNetworkMode = polkadot.networkMode;
        const savePolkadotVolume = polkadot.polkadotVolume;
        const savePrepared = polkadot.prepared;
        const saveCopyFilesToServiceDirectory = polkadot.copyFilesToServiceDirectory;
        const saveDockerGetMount = polkadot.docker.getMount;

        polkadot.copyFilesToServiceDirectory = async () => {};

        // Testing with default config
        polkadot.commonPolkadotOptions = [];

        await polkadot.prepareService();

        let commonPolkadotOptionsNeedToBe = [
            '--prometheus-external',
            '--prometheus-port',
            '9615',
            '--pruning=archive',
            '--rpc-cors',
            'http://localhost',
            '--rpc-port',
            '9993',
            '--chain',
            'kusama',
            '--db-cache',
            '512'
        ];

        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set');
        assert.equal(polkadot.prepared, true, 'check if polkadot service become prepared');

        // Testin polkadot node keyfile
        const savePolkadotNodeKeyFile = polkadot.config.polkadotNodeKeyFile;
        polkadot.config.polkadotNodeKeyFile = 'node-file.id'

        await polkadot.prepareService();

        commonPolkadotOptionsNeedToBe = [
            '--prometheus-external',
            '--prometheus-port',
            '9615',
            '--pruning=archive',
            '--rpc-cors',
            'http://localhost',
            '--rpc-port',
            '9993',
            '--chain',
            'kusama',
            '--db-cache',
            '512',
            '--node-key-file=/polkadot/keys/node-file.id'
        ];

        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set correctly for node keyfile');
        polkadot.config.polkadotNodeKeyFile = savePolkadotNodeKeyFile;

        // Test reserved nodes
        const saveReservedNodes = polkadot.config.polkadotReservedNodes;
        polkadot.config.polkadotReservedNodes = '127.0.0.1,127.0.0.2,127.0.0.3';

        await polkadot.prepareService();

        commonPolkadotOptionsNeedToBe = [
            '--prometheus-external', '--prometheus-port',
            '9615',                  '--pruning=archive',
            '--rpc-cors',            'http://localhost',
            '--rpc-port',            '9993',
            '--chain',               'kusama',
            '--db-cache',            '512',
            '--reserved-nodes',      '127.0.0.1',
            '--reserved-nodes',      '127.0.0.2',
            '--reserved-nodes',      '127.0.0.3'
        ];

        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set correctly for reserved nodes'); 
        polkadot.config.polkadotReservedNodes = saveReservedNodes;

        // Test polkadot telemetry url
        // No telemetry
        const saveTelemetrlyUrl = polkadot.config.polkadotTelemetryUrl;
        polkadot.config.polkadotTelemetryUrl = '--no-telemetry';
        await polkadot.prepareService();
        commonPolkadotOptionsNeedToBe = [
            '--prometheus-external',
            '--prometheus-port',
            '9615',
            '--pruning=archive',
            '--rpc-cors',
            'http://localhost',
            '--rpc-port',
            '9993',
            '--chain',
            'kusama',
            '--db-cache',
            '512',
            '--no-telemetry'
        ];
        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set correctly for no telemetry'); 
        
        // Test with telemetry url set
        polkadot.config.polkadotTelemetryUrl = 'ws://127.0.0.1';
        await polkadot.prepareService();
        commonPolkadotOptionsNeedToBe = [
            '--prometheus-external',
            '--prometheus-port',
            '9615',
            '--pruning=archive',
            '--rpc-cors',
            'http://localhost',
            '--rpc-port',
            '9993',
            '--chain',
            'kusama',
            '--db-cache',
            '512',
            '--telemetry-url',
            'ws://127.0.0.1'
        ];
        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set correctly for telemerty url set'); 
        polkadot.config.polkadotTelemetryUrl = saveTelemetrlyUrl;

        // Config testing test
        const saveConfigTesting = polkadot.config.testing;
        polkadot.config.testing = false;
        await polkadot.prepareService();
        assert.equal(polkadot.networkMode, `container:${os.hostname()}`, 'check if network mode was correctly set'); 
        polkadot.config.testing = saveConfigTesting;
        polkadot.networkMode = saveNetworkMode;

        // Test polkadot volume set
        // Mock docker get mount function
        const mount = {
            Name: 'mock-mount'
        };
        polkadot.docker.getMount = async () => mount;

        await polkadot.prepareService();
        assert.equal(polkadot.polkadotVolume, 'mock-mount', 'check if polkadot volume was set to mock mount'); 
        
        polkadot.docker.getMount = async () => false;

        await polkadot.prepareService();

        assert.equal(polkadot.polkadotVolume,  polkadot.config.polkadotPrefix + 'polkadot-volume', 'check if polkadot volume was set to polkadot default volume'); 
        polkadot.docker.getMount = saveDockerGetMount;

        // Restoring all functions 
        polkadot.commonPolkadotOptions = saveCommonPolkadotOpts;
        polkadot.polkadotVolume = savePolkadotVolume;
        polkadot.prepared = savePrepared;
        polkadot.copyFilesToServiceDirectory = saveCopyFilesToServiceDirectory;

    });

    after(async () => {
        await polkadot.cleanUp();
    });
});