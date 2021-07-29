/* eslint-disable */
const { exec } = require('child_process');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { Orchestrator } = require('../src/orchestrator');
const { Docker } = require('../src/docker');
const { Heartbeats } = require('../src/heartbeats');
const { Chain } = require('../src/chain');
const { getKeysFromSeed } = require('../src/utils');
const { constructConfiguration } = require('../src/config');
const { initApi } = require('../src/api');
const { assert } = require('@polkadot/util');

// Variables
let docker;
let chain;
let orchestrator;
let heartbeats;
let api;
let server;

// Test configuration
const testTimeout = 360000;
const mnemonic1 =
  'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';
const mnemonic2 =
  'fiscal toe illness tunnel pill spatial kind dash educate modify sustain suffer';
const mnemonic3 =
  'borrow initial guard hunt corn trust student opera now economy thumb argue';
const nodesWallets = '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs,5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex,5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s'
const archipelName = 'test-archipel';
// Construct config
const config = {
  nodeWs: 'ws://127.0.0.1:9944',
  heartbeatEnabled: true,
  orchestrationEnabled: true,
  mnemonic: mnemonic1,
  nodeGroupId: 1,
  nodesWallets: nodesWallets, 
  archipelName: archipelName,
  aliveTime: 12,
  service: 'polkadot',
  serviceMode: 'orchestrator',
  nodesWallets: nodesWallets,
  archipelName: archipelName
};

chai.use(chaiHttp);

// Promisify exec
const execAsync = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(Error(stdout + stderr));
      }
      resolve(stdout + stderr);
    });
  });

describe('Orchestrator test', function() {
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

    // Launch test chain
    console.log('Launching test chain. Can take some time...');
    const startCommandToExec = 'cd ../deployer/test/chain/ && ./launch.sh';
    await execAsync(startCommandToExec);
    console.log('Test chain was launched...');

    // Create Docker instance
    docker = new Docker();

    // Connect to Archipel Chain Node
    chain = new Chain(config.nodeWs);
    await chain.connect();

    // Create heartbeats instance
    heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);

    // Create Orchestrator instance
    orchestrator = new Orchestrator(
      config,
      chain,
      heartbeats);

    // Mock isServiceReadyToStart method of service
    orchestrator.service.serviceInstance.isServiceReadyToStart = () => true;

    // Init api
    const initApiReturn = await initApi(orchestrator);
    api = initApiReturn.app;
    server = initApiReturn.server;
  });

  after(async function() {
    // Remove service containers
    await orchestrator.service.serviceCleanUp();

    // Disconnect from test chain
    if (chain && await chain.isConnected()) {
      await chain.disconnect();
    }
  
    // Remove test chain
    console.log('Removing test chain...');
    const stopCommandToExec = 'cd ../deployer/test/chain && ./remove.sh';
    await execAsync(stopCommandToExec);
  
    // Remove created volumes
    const volumeRemoved = await docker.removeVolume('validatortest-polkadot-volume');
    console.log('Docker volume removed => ' + volumeRemoved);

    // Closing api server
    server.close();
  });

  it('Test orchestrator default information get', async () => {

    // Mock some functions to get previsible result
    const saveChainBestNumber = chain.getBestNumber;
    const saveGetPeerNumber = chain.getPeerNumber;
    const saveGetPeerId = chain.getPeerId;
    const saveGetLeader = chain.getLeader;

    chain.getBestNumber = async () => '0x00000001';
    chain.getPeerNumber = async () => 2;
    chain.getPeerId = async () => '12D3';
    chain.getLeader = async () => '12D4';

    const heartbeats = new Heartbeats(config.nodesWallets, config.archipelName);
    // Adding some heartbeats
    const keys1 = await getKeysFromSeed(mnemonic1);
    const keys2 = await getKeysFromSeed(mnemonic2);
    const keys3 = await getKeysFromSeed(mnemonic3);

    heartbeats.addHeartbeat(keys1.address.toString(), 1, 2, '0x00000001');
    heartbeats.addHeartbeat(keys2.address.toString(), 1, 2, '0x00000001');
    heartbeats.addHeartbeat(keys3.address.toString(), 1, 2, '0x00000001');

    const saveOrchestratorHeartbeats = orchestrator.heartbeats;
    orchestrator.heartbeats = heartbeats;
    
    const result = await chai.request(api).get('/');
    const bodyMustBe = {
        status: '200',
        orchestratorAddress: '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs',
        archipelName: 'test-archipel',
        isConnected: true,
        peerId: '12D3',
        peerNumber: 2,
        bestNumber: '0x00000001',
        synchState: false,
        leader: '12D4',
        service: 'polkadot',
        orchestrationEnabled: true,
        isServiceReadyToStart: true,
        serviceMode: 'passive',
        serviceContainer: 'none',
        heartbeatSendEnabledAdmin: true,
        heartbeatSendEnabled: true,
        heartbeats: [
          {
            wallet: '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs',
            name: 'test-archipel-NODE-1',
            group: 1,
            nodeStatus: 2,
            blockNumber: '0x00000001'
          },
          {
            wallet: '5H19p4jm177Aj4X28xwL2cAAbxgyAcitZU5ox8hHteScvsex',
            name: 'test-archipel-NODE-2',
            group: 1,
            nodeStatus: 2,
            blockNumber: '0x00000001'
          },
          {
            wallet: '5DqDvHkyfyBR8wtMpAVuiWA2wAAVWptA8HtnsvQT7Uacbd4s',
            name: 'test-archipel-NODE-3',
            group: 1,
            nodeStatus: 2,
            blockNumber: '0x00000001'
          }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns correct information in correct format');  
    chain.getBestNumber = saveChainBestNumber;
    chain.getPeerNumber = saveGetPeerNumber;
    chain.getPeerId = saveGetPeerId;
    chain.getLeader = saveGetLeader;
    orchestrator.heartbeats = saveOrchestratorHeartbeats;
  });

  it('Test unknown ressource', async () => {
    let result = await chai.request(api).get('/toto');
    let bodyMustBe = {
        errors: [
            {
              status: '404',
              title: 'Not found',
              detail: 'Requested resource was not found.'
            }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns an error if unknown ressource was requested');
  });

  it('Test heartbeats disable functionality', async () => {
    const saveHeartbeatSendEnabledAdmin = orchestrator.heartbeatSendEnabledAdmin;
    orchestrator.heartbeatSendEnabledAdmin = true;

    let result = await chai.request(api).get('/heartbeats/disable');
    let bodyMustBe = {
        status: '200',
        message: 'Success! Heartbeats send was disabled.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that hearbeats were disabled');
    chai.assert.equal(orchestrator.heartbeatSendEnabledAdmin, false, 'Check if hearbeats were really disabled in orchestrator');

    result = await chai.request(api).get('/heartbeats/disable');
    bodyMustBe = {
        errors: [
          {
            status: '500',
            title: 'Error',
            detail: 'Error: Heartbeats send is already disabled.'
          }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if we retry to disable hearbeats the api answers with an error');
    chai.assert.equal(orchestrator.heartbeatSendEnabledAdmin, false, 'Check if hearbeats remains disabled');

    orchestrator.heartbeatSendEnabledAdmin = saveHeartbeatSendEnabledAdmin;
  });


  it('Test heartbeats enable functionality', async () => { 
    const saveHeartbeatSendEnabledAdmin = orchestrator.heartbeatSendEnabledAdmin;
    orchestrator.heartbeatSendEnabledAdmin = false;

    let result = await chai.request(api).get('/heartbeats/enable');
    let bodyMustBe = {
        status: '200',
        message: 'Success! Heartbeats send was enabled.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that hearbeats were enabled');
    chai.assert.equal(orchestrator.heartbeatSendEnabledAdmin, true, 'Check if hearbeats were really enabled in orchestrator');

    result = await chai.request(api).get('/heartbeats/enable');
    bodyMustBe = {
        errors: [
          {
            status: '500',
            title: 'Error',
            detail: 'Error: Heartbeats send is already enabled.'
          }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if we retry to enable hearbeats the api answers with an error');
    chai.assert.equal(orchestrator.heartbeatSendEnabledAdmin, true, 'Check if hearbeats remains enabled');

    orchestrator.heartbeatSendEnabledAdmin = saveHeartbeatSendEnabledAdmin;
  });

  it('Test orchestration disable functionality', async () => {
    const saveOrchestrationEnabled = orchestrator.orchestrationEnabled;
    orchestrator.orchestrationEnabled = true;

    let result = await chai.request(api).get('/orchestration/disable');
    let bodyMustBe = {
        status: '200',
        message: 'Success! Orchestration was disabled.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that orchestration was disabled');
    chai.assert.equal(orchestrator.orchestrationEnabled, false, 'Check if orchestration was really disabled in orchestrator');

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    chai.assert.equal(container.description.State.Running, true, 'check if passive service container was started when orchestration is disabled');
  
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if active service container is not running');
  
    result = await chai.request(api).get('/orchestration/disable');
    bodyMustBe = {
        errors: [
          {
            status: '500',
            title: 'Error',
            detail: 'Error: Orchestration is already disabled.'
          }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if we retry to disable orchestration the api answers with an error');
    chai.assert.equal(orchestrator.orchestrationEnabled, false, 'Check if orchestration remains disabled');

    orchestrator.orchestrationEnabled = saveOrchestrationEnabled;
    // Remove service containers
    await orchestrator.service.serviceCleanUp();
  });


  it('Test orchestration enable functionality', async () => { 
    const saveOrchestrationEnabled = orchestrator.orchestrationEnabled;
    orchestrator.orchestrationEnabled = false;

    let result = await chai.request(api).get('/orchestration/enable');
    let bodyMustBe = {
        status: '200',
        message: 'Success! Orchestration was enabled.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that orchestration was enabled');
    chai.assert.equal(orchestrator.orchestrationEnabled, true, 'Check if orchestration was really enabled in orchestrator');

    result = await chai.request(api).get('/orchestration/enable');
    bodyMustBe = {
        errors: [
          {
            status: '500',
            title: 'Error',
            detail: 'Error: Orchestration is already enabled.'
          }
        ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if we retry to enable orchestration the api answers with an error');
    chai.assert.equal(orchestrator.heartbeatSendEnabledAdmin, true, 'Check if orchestration remains enabled');

    orchestrator.orchestrationEnabled = saveOrchestrationEnabled;
  });

  it('Test service start functionality', async () => {

    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    let container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if passive service container is not running');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if active service container is not running');

    let request = {
        mode: 'active'
    }
    let result = await chai.request(api).post('/service/start').send(request);
    let bodyMustBe = {
        status: '200',
        message: 'Success! Service was started in active mode.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that service was started in active mode');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container.description.State.Running, true, 'check if active service container is running');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if passive service container is not running');

    request = {
        mode: 'passive'
    }
    result = await chai.request(api).post('/service/start').send(request);
    bodyMustBe = {
        status: '200',
        message: 'Success! Service was started in passive mode.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that service was started in passive mode');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-sync`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container.description.State.Running, true, 'check if passive service container is running');

    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if active service container is not running');

    // Remove service containers
    await orchestrator.service.serviceCleanUp();
  });

  it('Test service start without passing service mode', async () => {

    let result = await chai.request(api).post('/service/start').send({});
    let bodyMustBe = {
      errors: [
        {
          status: '500',
          title: 'Error',
          detail: 'Error: Service start mode is empty'
        }
      ]
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns an error cause service mode is empty');

  });

  it('Test service stop functionality', async () => { 
    // Starting service in active mode
    let request = {
        mode: 'active'
    }
    let result = await chai.request(api).post('/service/start').send(request);
    let bodyMustBe = {
        status: '200',
        message: 'Success! Service was started in active mode.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that service was started in active mode');
    let containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    let container = await docker.getContainer(containerName);
    chai.assert.equal(container.description.State.Running, true, 'check if active service container was started');

    // Stopping service
    result = await chai.request(api).get('/service/stop');
    bodyMustBe = {
        status: '200',
        message: 'Success! Service was stopped.'
    };
    chai.assert.equal(JSON.stringify(result.body), JSON.stringify(bodyMustBe), 'Check if API returns that service was stopped');
    containerName = `${process.env.POLKADOT_PREFIX}polkadot-validator`;
    container = await docker.getContainer(containerName);
    chai.assert.equal(container, false, 'check if active service container is not running');

    // Remove service containers
    await orchestrator.service.serviceCleanUp();
  });
});