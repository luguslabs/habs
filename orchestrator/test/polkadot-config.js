/* eslint-disable */
const { assert } = require('chai');
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
process.env.DEBUG = 'polkadot';

// Test configuration
const testTimeout = 360000;

describe('Polkadot config test', function () {
    this.timeout(testTimeout);

    before(() => {
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
        process.env.POLKADOT_ARCHIVE_NODE = 'false';
    });

    after(() => {
        delete process.env.CONFIG_FILE;
        delete process.env.CONFIG_FILE_PATH;
        delete process.env.NODE_ID;
        delete process.env.POLKADOT_SIMULATE_SYNCH;
        delete process.env.POLKADOT_PREFIX;
        delete process.env.POLKADOT_ADDITIONAL_OPTIONS;
        delete process.env.TESTING;
        delete process.env.POLKADOT_IMAGE;
        delete process.env.POLKADOT_ARCHIVE_NODE;
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
            databasePath: '/data',
            polkadotSessionKeyToCheck: undefined,
            polkadotSimulateSynch: false,
            polkadotArchiveNode: false,
            testing: true,
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

        const savePolkadotArchiveNOde = process.env.POLKADOT_ARCHIVE_NODE;
        delete process.env.POLKADOT_ARCHIVE_NODE;

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
            polkadotReservedNodes:"/ip4/10.0.1.1/tcp/30333/p2p/12D3KooWDNrN2hVjFFRBEyJj51v8eAc6wGwZSya3R8NAMkp2q2FH,/ip4/10.0.1.2/tcp/30333/p2p/12D3KooWMNzALuzPUsUu5NzXfoptqbGuNEyEVwHftg9cK2hHwi7q,/ip4/10.0.1.3/tcp/30333/p2p/12D3KooWPFRHGaB72WeMDVAPiYzJy7tRCQZ8qJUhcfi3igHCrzdU,/ip4/10.0.1.4/tcp/30333/p2p/12D3KooWGEzk9GuSxZQaDnBTMcjcRkA1owxVQ2Mv1gCKqsMMDaWU,/ip4/10.0.1.5/tcp/30333/p2p/12D3KooWHXemKWkMsATyP3apmjATy2VDHcG5NkZ4rjcuSXENF1G8,/ip4/10.0.1.6/tcp/30333/p2p/12D3KooWKpBYesbEvoCJs3FJeJykBb3z99ZYKSffLifsQVeyLCtP,/ip4/10.0.1.7/tcp/30333/p2p/12D3KooWDXDEt38Hu7hmabQmKv7SLUcUH6Bne68db6hRAA61c3nk,/ip4/10.0.1.8/tcp/30333/p2p/12D3KooWNEzbDR5phaNdwb9g246yDG88N7PkyQfrxpGPPCmm7TBU,/ip4/10.0.1.9/tcp/30333/p2p/12D3KooWKBfa6y2qKiQNc6gMCPtJm8ePVUYz7YMxU3jyxrp2JhUR",
            polkadotNodeKeyFile: "polkadot-node-id-0",
            polkadotUnixUserId: 1000,
            polkadotUnixGroupId: 1000,
            polkadotRpcPort: 9993,
            polkadotImage: 'parity/polkadot:latest',
            polkadotPrefix: 'node-',
            polkadotValidatorName: undefined,
            polkadotTelemetryUrl: undefined,
            polkadotAdditionalOptions: undefined,
            databasePath: '/data',
            polkadotSessionKeyToCheck: undefined,
            polkadotSimulateSynch: true,
            polkadotArchiveNode: true,
            testing: false
        };

        assert.equal(JSON.stringify(config), JSON.stringify(configMustBe), 'Check if configuration was constructed correctly');

        process.env.POLKADOT_PREFIX = saveValidatorPrefix;
        process.env.POLKADOT_ADDITIONAL_OPTIONS = saveAddOpts;
        process.env.TESTING = saveTesting;
        process.env.POLKADOT_IMAGE = savePolkadotImage;
        process.env.NODE_ID = '1';
        process.env.POLKADOT_SIMULATE_SYNCH = 'true';
        process.env.POLKADOT_ARCHIVE_NODE = savePolkadotArchiveNOde;
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

});