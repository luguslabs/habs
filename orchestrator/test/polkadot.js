/* eslint-disable */
const { assert } = require('chai');
const { Docker } = require('../src/docker');

const { Polkadot } = require('../src/services/polkadot/service');

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
process.env.TESTING = true;

// Variables
let polkadot;
let docker;

// Test configuration
const testTimeout = 360000;

describe('Orchestrator test', function() {
    this.timeout(testTimeout);
  
    before(async function() {
        polkadot = new Polkadot();
        docker = new Docker();
    });

    it('Check polkadot active service start', async function () {
        await polkadot.start('active');

        await polkadot.cleanUp();
    });

    it('Check polkadot passive service start', async function () {
        await polkadot.start('passive');

        await polkadot.cleanUp();
    });

    after(async function() {
        await polkadot.cleanUp();
    });
});