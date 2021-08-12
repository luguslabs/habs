/* eslint-disable */
const { assert } = require('chai');

const { Service } = require('../src/service');
const { Polkadot } = require('../src/services/polkadot/polkadot');

// Variables
let service;

// Test configuration
const testTimeout = 360000;

describe('Service test', function() {
    this.timeout(testTimeout);
  
    before(async function() {
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

        service = new Service('polkadot');
    });

    after(async function() {
        service.serviceCleanUp();
    });

    it('Test service initialization', async function () {
        assert.equal(service.serviceName, 'polkadot', 'Check if service name was set correctly');
        assert.equal(service.mode, 'passive', 'Check if default mode was set correctly');
        assert.equal(service.serviceInstance instanceof Polkadot, true, 'Check if polkadot instance was created and set correctly');
    });

    it('Test service start', async function () {
        let serviceMode = 'passive';
        const saveServiceInstanceStart = service.serviceInstance.start;
        service.serviceInstance.start = async (mode) => {
            serviceMode = mode;
        }

        await service.serviceStart('active');

        assert.equal(service.mode, 'active', 'Check if mode was changed');
        assert.equal(serviceMode, 'active', 'Check if service instance start was called correctly');

        service.serviceInstance.start = saveServiceInstanceStart;
    });

    it('Test service cleanup function', async function () {
        let cleanUpCalled = false;
        const saveServiceInstanceCleanUp = service.serviceInstance.cleanUp;
        service.serviceInstance.cleanUp = async () => {
            cleanUpCalled = true;
        }
        await service.serviceCleanUp();

        assert.equal(cleanUpCalled, true, 'Check if service instance cleanup was called correctly');

        service.serviceInstance.cleanUp = saveServiceInstanceCleanUp;
    });

    it('Test service ready function', async function () {
        const saveServiceInstanceIsServiceReadyToStart = service.serviceInstance.isServiceReadyToStart;
        service.serviceInstance.isServiceReadyToStart = async () => true;

        assert.equal(await service.serviceReady(), true, 'Check if service ready result is correct');

        service.serviceInstance.isServiceReadyToStart = saveServiceInstanceIsServiceReadyToStart;
    });

    it('Test service check function', async function () {
        const saveServiceInstanceCheckLaunchedContainer = service.serviceInstance.checkLaunchedContainer;
        service.serviceInstance.checkLaunchedContainer = async () => 'active';

        assert.equal(await service.serviceCheck(), 'active', 'Check if service check result is correct');

        service.serviceInstance.checkLaunchedContainer = saveServiceInstanceCheckLaunchedContainer;
    });

    it('Trying to create wrong service instance', async function () {
        try {
            new Service('toto');
        } catch (error) {
            assert.equal(error.toString(), 'Error: Service toto is not supported yet.', 'Check if error is thrown if invalid service');
        }
    });

    it('Test get service info', async () => {
        const saveServiceInstanceGetInfo = service.serviceInstance.getInfo;
        service.serviceInstance.getInfo = async () => { return { test: 'test' } };

        assert.equal(JSON.stringify(await service.getServiceInfo()), JSON.stringify({ test: 'test' }), 'Check if service info returns a good result');

        service.serviceInstance.getInfo = saveServiceInstanceGetInfo;
    });
});