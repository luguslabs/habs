/* eslint-disable */
const { assert } = require('chai');
const os = require('os');
const fs = require('fs');
const { Docker } = require('../src/docker');
const { Polkadot } = require('../src/services/polkadot/polkadot');
const { getKeysFromSeed } = require('../src/utils');

// Variables
let polkadot;
let docker;

// Test configuration
const testTimeout = 360000;

describe('Polkadot test', function () {
    this.timeout(testTimeout);
  
    before(async () => {
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
        polkadot = new Polkadot();
        docker = new Docker();
    });

    after(async () => {
        await polkadot.cleanUp();
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
        const saveCheckKeyAdded = polkadot.checkKeyAdded;
        polkadot.checkKeyAdded = async () => false;
        importKey = await polkadot.importKey(containerName, 'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud', 'ed25519', 'gran');
        assert.equal(importKey, false, 'check if check command fails the function returns false');
        polkadot.checkKeyAdded = saveCheckKeyAdded;

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
    // TODO: Make work this functionality
    it('Test checkSessionKeysOnNode function', async () => {
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

        let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;

        const savePolkadotSessionKeyToCheck = polkadot.config.polkadotSessionKeyToCheck;

        polkadot.config.polkadotSessionKeyToCheck = mustBeImportedKeys[0];
        let result = await polkadot.checkSessionKeysOnNode(containerName);
        assert.equal(result, false, 'check if session keys on node check fails with bad key');

        polkadot.config.polkadotSessionKeyToCheck = mustBeImportedKeys.reduce((string, element) => `${string}${element.substring(2)}`, '0x');
        console.log(polkadot.config.polkadotSessionKeyToCheck);

        // TODO: MAKE THE TRUE TEST WORK
        //result = await polkadot.checkSessionKeysOnNode(containerName);
        //assert.equal(result, true, 'check if session keys on node check returns true');

        // Make the same check for passive polkadot
        await polkadot.start('passive');
        containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

        const saveDockerExecuteSave = polkadot.docker.dockerExecute;

        polkadot.docker.dockerExecute = async () => { throw Error('Error simulation') };

        result = await polkadot.checkSessionKeysOnNode(containerName);
        assert.equal(result, false, 'check if function returns false if error was thrown');

        polkadot.docker.dockerExecute = async () => false;

        result = await polkadot.checkSessionKeysOnNode(containerName);
        assert.equal(result, false, 'check if function returns false if docker execute returns false');

        polkadot.docker.dockerExecute = async () => { return "{ this: true }" };

        result = await polkadot.checkSessionKeysOnNode(containerName);
        assert.equal(result, true, 'check if function returns true if docker execute result contains true value');

        delete polkadot.config.polkadotSessionKeyToCheck;
        result = await polkadot.checkSessionKeysOnNode(containerName);
        assert.equal(result, false, 'check if session keys on node check fails with empty session key to check');

        polkadot.docker.dockerExecute = saveDockerExecuteSave;
        polkadot.config.polkadotSessionKeyToCheck = savePolkadotSessionKeyToCheck;
        polkadot.importedKeys = [];
        await polkadot.cleanUp();
    });

    it('Test getLastFinalizedBlock function', async () => {
        let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
        // Mock system health get
        const saveDockerExecute = polkadot.docker.dockerExecute;

        let systemHealthGetResult = `{"jsonrpc":"2.0","result":{"currentBlock":2323},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        let result = await polkadot.getCurrentBlock(containerName);
        assert.equal(result, 2323, 'Check if current block was successfully retrieved');

        systemHealthGetResult = `{"jsonrpc":"2.0","result":{"error":"No block"},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        result = await polkadot.getCurrentBlock(containerName);
        assert.equal(result, false, 'Check if request to get current block failed the function returns 0');

        polkadot.docker.dockerExecute = () => false;

        result = await polkadot.getCurrentBlock(containerName);
        assert.equal(result, false, 'Check if docker execute failed the function returns 0');

        console.log(`Current block value is ${result}`);

        polkadot.docker.dockerExecute = saveDockerExecute;
    });

    it('Test checkKeyAdded function', async () => {
        await polkadot.start('passive');
    
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
    
        let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    
        let result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[0], 'gran');
        assert.equal(result, true, 'Check if gran key was added correctly');

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[1], 'babe');
        assert.equal(result, true, 'Check if babe key was added correctly');

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[2], 'imon');
        assert.equal(result, true, 'Check if imon key was added correctly');

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[3], 'para');
        assert.equal(result, true, 'Check if para key was added correctly');

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[4], 'asgn');
        assert.equal(result, true, 'Check if asgn key was added correctly');

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[5], 'audi');
        assert.equal(result, true, 'Check if audi key was added correctly');

        const saveDockerExecute = polkadot.docker.dockerExecute;
        polkadot.docker.dockerExecute = async () => false;

        result = await polkadot.checkKeyAdded(containerName, mustBeImportedKeys[5], 'audi');
        assert.equal(result, false, 'Check if check key added returns false if docker execute returns false');

        polkadot.importedKeys = [];
        polkadot.docker.dockerExecute = saveDockerExecute;
        await polkadot.cleanUp();
    });

    it('Test polkadot keys import fail', async () => {
        const saveImportKey = polkadot.importKey;

        // Make import key to throw an error
        polkadot.importKey = async () => { throw Error('Simulating general fail'); }

        let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        const keysImportResult = await polkadot.polkadotKeysImport(containerName);

        assert.equal(keysImportResult, false, 'Must return false cause import key throws an error');

        polkadot.importKey = saveImportKey;
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
        assert.equal(serviceReadyToStart, true, 'check if service is ready for active service');

        polkadot.importedKeys = [];
        serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready to start for active service cause not all keys where added to keystore');

        // Launching service and testing
        const saveGetCurrentBlock = polkadot.getCurrentBlock;
        await polkadot.start('passive');

        polkadot.getCurrentBlock = async () => 1000000;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, true, 'check if service is ready for passive service');
        assert.equal(polkadot.lastKnownBlock, 1000000, 'check if last known block is set correctly');

        polkadot.docker.dockerExecute = () => false;
        polkadot.getCurrentBlock = async () => 1000001;

        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, false, 'check if service is ready returns false if docker execute failed');

        systemHealthGetResult = `{"jsonrpc":"2.0"}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        polkadot.getCurrentBlock = async () => 1000003;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, false, 'check if service is ready returns false if no result field given by docker execute');

        systemHealthGetResult = `{"jsonrpc":"2.0","result":{"isSyncing":false,"peers":20,"shouldHavePeers":true},"id":1}`;
        polkadot.docker.dockerExecute = () => systemHealthGetResult;

        polkadot.getCurrentBlock = async () => 1000004;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, true, 'check if service is ready returns true cause all checks passed');

        polkadot.getCurrentBlock = async () => 1000004;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, false, 'check if service is ready returns false if chain is not moving forward 1');

        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, false, 'check if service is ready returns false if chain is not moving forward 2');

        polkadot.getCurrentBlock = async () => 1000005;
        serviceReadyToStart = await polkadot.isServiceReadyToStart('passive');
        assert.equal(serviceReadyToStart, true, 'check if service is ready returns true cause chain moved forward');

        polkadot.importedKeys = [];
        polkadot.getCurrentBlock = saveGetCurrentBlock;
        polkadot.docker.dockerExecute = saveDockerExecute;
        await polkadot.cleanUp();
    });

    it('Test if service ready to start fail', async () => {
        const saveDockerContainerRunning = polkadot.docker.isContainerRunning;
        polkadot.docker.isContainerRunning = async () => { throw Error('Simulate error throw'); }

        let serviceReadyToStart = await polkadot.isServiceReadyToStart('active');
        assert.equal(serviceReadyToStart, false, 'check if service is not ready cause an exception was thrown');

        polkadot.docker.isContainerRunning = saveDockerContainerRunning;
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
        const saveCopyPolkadotNodeKeyFile = polkadot.copyPolkadotNodeKeyFile;
        const saveDockerGetMount = polkadot.docker.getMount;

        polkadot.copyPolkadotNodeKeyFile = () => {};

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

        // Test no additional options
        const savePolkadotAdditionalOptions = polkadot.config.polkadotAdditionalOptions;
        polkadot.config.polkadotAdditionalOptions = '';

        await polkadot.prepareService();

        commonPolkadotOptionsNeedToBe = [
            '--prometheus-external',
            '--prometheus-port',
            '9615',
            '--pruning=archive',
            '--rpc-cors',
            'http://localhost',
            '--rpc-port',
            '9993'
        ];

        assert.equal(JSON.stringify(polkadot.commonPolkadotOptions), JSON.stringify(commonPolkadotOptionsNeedToBe), 'check if common options where set');
        assert.equal(polkadot.prepared, true, 'check if polkadot service become prepared');

        polkadot.config.polkadotAdditionalOptions = savePolkadotAdditionalOptions;

        // Test polkadot node keyfile
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
        polkadot.copyPolkadotNodeKeyFile = saveCopyPolkadotNodeKeyFile;

    });

    it('Test prepare and start function', async () => {
        // Constructing args list
        const mustBeArgs = [
            '--name',
            `${polkadot.name}-passive`,
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
            '--validator'
        ];

        // Constructing container data
        const containerData = {
            name: '',
            Image: polkadot.config.polkadotImage,
            Cmd: mustBeArgs
        };

        const validatorContainerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        const syncContainerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

        let prepareAndStart = await polkadot.prepareAndStart(containerData, validatorContainerName, syncContainerName);
        assert.equal(prepareAndStart, true, 'Checking if prepare and start returns true 1');

        let container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, true, 'check if validator container was launched');

        prepareAndStart = await polkadot.prepareAndStart(containerData, validatorContainerName, syncContainerName);
        assert.equal(prepareAndStart, false, 'Checking if prepare and start returns false cause container is already started');

        // Stopping docker container and see if it will be restarted
        await docker.stopContainer(validatorContainerName);

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, false, 'check if validator service container is not running');

        prepareAndStart = await polkadot.prepareAndStart(containerData, validatorContainerName, syncContainerName);
        assert.equal(prepareAndStart, true, 'Checking if prepare and start returns true 2');

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, true, 'check if validator container was relaunched');

        // Stopping one container and launching another
        prepareAndStart = await polkadot.prepareAndStart(containerData, syncContainerName, validatorContainerName);
        assert.equal(prepareAndStart, true, 'Checking if prepare and start returns true 3');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container.description.State.Running, true, 'check if sync container was launched');

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container, false, 'check if validator container was stopped');

        // Testing if container was launched with correct info
        container = await docker.getContainer(syncContainerName);
        assert.equal(JSON.stringify(container.description.Args), JSON.stringify(mustBeArgs), 'Check if active container was launched with correct args');
        assert.equal(container.description.Config.Image, polkadot.config.polkadotImage, 'Check if active container was launched with correct image');
        assert.equal(container.description.Name, `/${syncContainerName}`, 'Check if active container was launched with correct name');

        await polkadot.cleanUp();
    });

    it('Test start service container function', async () => {
        const mustBeArgs = [
            '--name',
            `${polkadot.name}-passive`,
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

        const validatorContainerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        const syncContainerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

        // Launching service in active mode
        let startServiceContainer = await polkadot.startServiceContainer("active", validatorContainerName, syncContainerName, polkadot.config.polkadotImage, mustBeArgs, '/polkadot', 'test-service-volume', 'host');
        assert.equal(startServiceContainer, true, 'See if start service container returns true');

        let container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, true, 'check if validator container was launched');

        // Check network mode set
        assert.equal(container.description.HostConfig.NetworkMode, 'host', 'Check if container network mode was set correctly');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container, false, 'check if sync container is not launched');

        startServiceContainer = await polkadot.startServiceContainer("active", validatorContainerName, syncContainerName, polkadot.config.polkadotImage, mustBeArgs, '/polkadot', 'test-service-volume', 'host');
        assert.equal(startServiceContainer, false, 'See if start service container returns false cause active container was already launched');

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, true, 'check if validator container remains launched');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container, false, 'check if sync container remains not launched');

        // Launching service in passive mode
        startServiceContainer = await polkadot.startServiceContainer("passive", validatorContainerName, syncContainerName, polkadot.config.polkadotImage, mustBeArgs, '/polkadot', 'test-service-volume', 'host');
        assert.equal(startServiceContainer, true, 'See if start service container returns true 2');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container.description.State.Running, true, 'check if passive container was launched');

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container, false, 'check if validator container is not launched');

        startServiceContainer = await polkadot.startServiceContainer("passive", validatorContainerName, syncContainerName, polkadot.config.polkadotImage, mustBeArgs, '/polkadot', 'test-service-volume', 'host');
        assert.equal(startServiceContainer, false, 'See if start service container returns false cause passive container was already launched');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container.description.State.Running, true, 'check if passive container remains launched');

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container, false, 'check if validator container remains not launched');

        try {
            await polkadot.startServiceContainer("toto", validatorContainerName, syncContainerName, polkadot.config.polkadotImage, mustBeArgs, '/polkadot', 'test-service-volume', 'host');
        } catch (error) {
            assert.equal(error.toString(), `Error: Service type 'toto' is unknown.`, 'Check if function throws an unknown service error');
        }

        await docker.removeVolume('test-service-volume');
        await polkadot.cleanUp();
    });

    it('Test polkadot start function', async () => {
        assert.equal(polkadot.name, polkadot.config.polkadotName, 'Check if name was correctly set');

        // Try to launch polkadot in unknown mode
        try {
            await polkadot.start('toto');
        } catch (error) {
            assert.equal(error.toString(), `Error: Mode 'toto' is unknown.`);
        }

        // Launching in active mode with polkadot validator name and checking
        const savePolkadotValidatorName = polkadot.config.polkadotValidatorName;
        polkadot.config.polkadotValidatorName = 'archipel-test-validator';
        // Launching service and testing
        await polkadot.start('active');
        assert.equal(polkadot.name, polkadot.config.polkadotValidatorName, 'Check if name was correctly set if polkadot validator name is set in config');
        
        containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
        container = await docker.getContainer(containerName);
        assert.equal(container, false, 'check if passive service container is not running');

        containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        container = await docker.getContainer(containerName);
        assert.equal(container.description.State.Running, true, 'check if active service container was started');

        // Check params of launched container
        let mustBeArgs = [
            '--name',
            `${polkadot.config.polkadotValidatorName}`,
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
            '--validator'
        ];

        assert.equal(JSON.stringify(container.description.Args), JSON.stringify(mustBeArgs), 'Check if active container was launched with correct args');
        assert.equal(container.description.Config.Image, polkadot.config.polkadotImage, 'Check if active container was launched with correct image');
        assert.equal(container.description.Name, `/${containerName}`, 'Check if active container was launched with correct name');
        assert.equal(container.description.Mounts[0].Name, polkadot.polkadotVolume, 'Check if active container was launched with correct mount name');
        assert.equal(container.description.Mounts[0].Destination, '/polkadot', 'Check if active container was launched with correct destination');
        polkadot.config.polkadotValidatorName = savePolkadotValidatorName;
        polkadot.importedKeys = [];
        await polkadot.cleanUp();

        // Launching in passive mode and checking
        await polkadot.start('passive');

        containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        container = await docker.getContainer(containerName);
        assert.equal(container, false, 'check if active service container is not running');

        containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
        container = await docker.getContainer(containerName);
        assert.equal(container.description.State.Running, true, 'check if passsive service container was started');

        // Check params of launched container
        mustBeArgs = [
            '--name',
            `${polkadot.name}-passive`,
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

        assert.equal(JSON.stringify(container.description.Args), JSON.stringify(mustBeArgs), 'Check if passive container was launched with correct args');
        assert.equal(container.description.Config.Image, polkadot.config.polkadotImage, 'Check if passive container was launched with correct image');
        assert.equal(container.description.Name, `/${containerName}`, 'Check if passive container was launched with correct name');
        assert.equal(container.description.Mounts[0].Name, polkadot.polkadotVolume, 'Check if passive container was launched with correct mount name');
        assert.equal(container.description.Mounts[0].Destination, '/polkadot', 'Check if passive container was launched with correct destination');
        polkadot.importedKeys = [];
        await polkadot.cleanUp();
    });

    it('Check if keys will not be added if container was not able to start', async () => {
        const saveStartServiceContainer = polkadot.startServiceContainer;

        polkadot.startServiceContainer = async () => false;

        let startResult = await polkadot.start('active');
        assert.equal(startResult, false, 'Check if start returns false for active container if start service container was false');

        startResult = await polkadot.start('passive');
        assert.equal(startResult, false, 'Check if start returns false for passive container if start service container was false');

        polkadot.startServiceContainer = saveStartServiceContainer;
    });

    it('Test cleanup function', async () => {
        // Constructing container data
        const containerData = {
            name: '',
            Image: polkadot.config.polkadotImage
        };

        const validatorContainerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
        const syncContainerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;

        let prepareAndStart = await polkadot.prepareAndStart(containerData, validatorContainerName, syncContainerName);
        assert.equal(prepareAndStart, true, 'Checking if prepare and start returns true 1');

        let container = await docker.getContainer(validatorContainerName);
        assert.equal(container.description.State.Running, true, 'check if validator container was launched');

        await polkadot.cleanUp();

        container = await docker.getContainer(validatorContainerName);
        assert.equal(container, false, 'check if validator container was removed');

        prepareAndStart = await polkadot.prepareAndStart(containerData, syncContainerName, validatorContainerName);
        assert.equal(prepareAndStart, true, 'Checking if prepare and start returns true 2');

        container = await docker.getContainer(syncContainerName);
        assert.equal(container.description.State.Running, true, 'check if sync container was launched');

        await polkadot.cleanUp();

        container = await docker.getContainer(syncContainerName);
        assert.equal(container, false, 'check if sync container was removed');

        // Launching two cleanups in parralel to check double cleanup
        await Promise.all([polkadot.cleanUp(), polkadot.cleanUp()]);
    });

    it('Test cleanup function fail', async () => {
        const saveDockerRemoveContainer = polkadot.docker.removeContainer;
        polkadot.docker.removeContainer = async () => { throw Error('Simulate error throw'); }

        const cleanupResult = await polkadot.cleanUp();
        assert.equal(cleanupResult, false, 'Check if cleanup result returns false cause an exception was thrown');

        polkadot.docker.removeContainer = saveDockerRemoveContainer;
    });

    it('Test copyPolkadotNodeKeyFile function', async () => {
        const savePolkadotKeyFile = polkadot.config.polkadotNodeKeyFile;
        const savePolkadotUnixUserId = polkadot.config.polkadotUnixUserId;
        const savePolkadotUnixGroupId = polkadot.config.polkadotUnixGroupId;
        polkadot.config.polkadotNodeKeyFile = 'mock-key-file';
        polkadot.config.polkadotUnixUserId = 1001;
        polkadot.config.polkadotUnixGroupId = 1001;

        fs.writeFileSync(`/tmp/${polkadot.config.polkadotNodeKeyFile}`, 'mock key file');
        assert.equal(fs.existsSync(`/tmp/${polkadot.config.polkadotNodeKeyFile}`), true, 'Check if file was successfully created')

        polkadot.copyPolkadotNodeKeyFile('/tmp','/tmp/service/keys');

        assert.equal(fs.existsSync(`/tmp/service/keys`), true, 'Check if /tmp/service/keys was successfully created');
        assert.equal(fs.existsSync(`/tmp/service/keys/${polkadot.config.polkadotNodeKeyFile}`), true, `Check if ${polkadot.config.polkadotNodeKeyFile} was copied to /tmp/service/keys`);

        //const fileStats = fs.statSync(`/tmp/service/keys/${polkadot.config.polkadotNodeKeyFile}`);
        //assert.equal(fileStats.uid, polkadot.config.polkadotUnixUserId, 'Check if file uid was set correctly');
        //assert.equal(fileStats.gid, polkadot.config.polkadotUnixUserId, 'Check if file gid was set correctly');

        fs.rmdirSync(`/tmp/service`, { recursive: true });
        fs.unlinkSync(`/tmp/${polkadot.config.polkadotNodeKeyFile}`);

        polkadot.config.polkadotNodeKeyFile = savePolkadotKeyFile;
        polkadot.config.polkadotUnixUserId = savePolkadotUnixUserId;
        polkadot.config.polkadotUnixGroupId = savePolkadotUnixGroupId;
    });

    it('Test copyPolkadotNodeKeyFile function fails', async () => {
        try{
            polkadot.copyPolkadotNodeKeyFile();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Must set to and from dirs', 'Check if copy fails when no arguments were given');
        }
        try{
            polkadot.copyPolkadotNodeKeyFile('/fromdir');
        } catch (error) {
            assert.equal(error.toString(), 'Error: Must set to and from dirs', 'Check if copy fails when only from dir is given');
        }
        try{
            polkadot.copyPolkadotNodeKeyFile('fromdir','/todir');
        } catch (error) {
            assert.equal(error.toString(), 'Error: Please specify absolute path', 'Check if copy fails when from dir is no absolute path');
        }
        try{
            polkadot.copyPolkadotNodeKeyFile('/fromdir', 'todir');
        } catch (error) {
            assert.equal(error.toString(), 'Error: Please specify absolute path', 'Check if copy fails when to dir is no absolute path');
        }
    });

    it('Test get info function', async () => {
        const savePolkadotSessionKeyToCheck = polkadot.config.polkadotSessionKeyToCheck;

        delete polkadot.config.polkadotSessionKeyToCheck;

        let startResult = await polkadot.start('active');
        assert.equal(startResult, true, 'Check if polkadot validator was started');

        let result = await polkadot.getInfo();

        assert.equal(result.sessionKeysString, undefined, 'Check if sessionKeysString was set correctly');
        assert.equal(result.checkSessionKeysOnNode, false, 'Check if checkSessionKeysOnNode was set correctly');
        assert.equal(result.launchedContainer, 'active', 'Check if launchedContainer was set correctly');

        polkadot.config.polkadotSessionKeyToCheck = savePolkadotSessionKeyToCheck;

        await polkadot.cleanUp();
    });
});