/* eslint-disable */
const { assert } = require('chai');
const { Readable } = require("stream");
const fs = require('fs-extra');
const sinon = require('sinon');

const {
    getKeysFromSeed,
    streamToString,
    catchExitSignals,
    isEmptyString,
    readToObj,
    checkVariable,
    formatOptionList,
    formatOptionCmds,
    constructNodesList,
    fromModeToNodeStatus,
    transactionGetStatus
} = require('../src/utils');

// Test configuration
const testTimeout = 60000;
const mnemonic1 =
  'mushroom ladder bomb tornado clown wife bean creek axis flat pave cloud';

describe('Utils test', function () {
    this.timeout(testTimeout);

    it('Test get keys from seed', async () => {
        const key = await getKeysFromSeed(mnemonic1);
        assert.equal(key.address, '5FmqMTGCW6yGmqzu2Mp9f7kLgyi5NfLmYPWDVMNw9UqwU2Bs', 'check if address was retrieved correctly from seed');
        try {
            await getKeysFromSeed();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Provided wallet seed is not valid.', 'check if exception was raised if seed is empty');
        }
    });

    it('Test stream to string', async () => {
        const readable = Readable({read(size) {
            this.push("your string here");
            this.push(null);
          }});
        const stringFromStream = await streamToString(readable);
        assert.equal(stringFromStream, 'your string here', 'check if stream was correctly read');
    });

    it('Test read to object', () => {
        const obj = {
            a: true,
            b: false
        }

        fs.writeFileSync('/tmp/archipel-test-file.json', JSON.stringify(obj));
     
        const objectFromFile = readToObj('/tmp/archipel-test-file.json');
        
        assert.equal(objectFromFile.a, true, 'check if object was read correctly (a param)');
        assert.equal(objectFromFile.b, false, 'check if object was read correctly (b param)');

        fs.unlinkSync('/tmp/archipel-test-file.json');
    });

    it('Test from mode to node status', () => {
        assert.equal(fromModeToNodeStatus('active'), 1, 'Check from active mode to node status');
        assert.equal(fromModeToNodeStatus('passive'), 2, 'Check from passive mode to node status');
        assert.equal(fromModeToNodeStatus('unknown-mde'), 0, 'Check from unknown mode to node status');
    });

    it('Test is empty string function', () => {
        assert.equal(isEmptyString(), true, 'Check result if string is undefined');
        assert.equal(isEmptyString(''), true, 'Check result if string is empty');
        assert.equal(isEmptyString('toto'), false, 'Check result if string is not empty');
    });

    it('Test check variable function', () => {
        assert.equal(checkVariable('value', 'KEY'), true, 'Check if variable is correctly set');
        try {
            checkVariable();
        } catch (error) {
            assert.equal(error.toString(), 'Error: Error! Variable undefined was not set.', 'Check if params are undefined');
        }
        try {
            checkVariable('','WANNABE');
        } catch (error) {
            assert.equal(error.toString(), 'Error: Error! Variable WANNABE was not set.', 'Check if params are undefined');
        }
    });

    it('Test format option list', () => {
        const option = '--reserved';
        const inputList = '127.0.0.1,127.0.0.2,127.0.0.3';
        const resultList = ['--reserved', '127.0.0.1', '--reserved', '127.0.0.2', '--reserved', '127.0.0.3']

        assert.equal(formatOptionList('', '').toString(), [].toString(), 'Check if empty input list and option is passed');
        assert.equal(formatOptionList(option, '').toString(), [].toString(), 'Check if empty input list is passed');
        assert.equal(formatOptionList(option, inputList).toString(), resultList.toString(), 'Check if empty input list is passed');
    });

    it('Test format option commands', () => {
        assert.equal(formatOptionCmds().toString(), [].toString(), 'Test if input commands are undefined');
        assert.equal(formatOptionCmds('--validator').toString(), ['--validator'].toString(), 'Test if one input command is passed');
        assert.equal(formatOptionCmds('--validator --nominator --collator').toString(), ['--validator', '--nominator', '--collator'].toString(), 'Test if one input command is passed');
    });

    it('Test construct nodes list', () => {
        const nodesWallets = '0x1,0x2,0x3';
        const archipelName = 'test';
        const result = [
            {
                wallet: '0x1',
                name: `${archipelName}-NODE-1`
            },
            {
                wallet: '0x2',
                name: `${archipelName}-NODE-2`
            },
            {
                wallet: '0x3',
                name: `${archipelName}-NODE-3`
            }
        ];

        assert.equal(constructNodesList().toString(), [].toString(), 'Check if params are undefined');
        assert.equal(JSON.stringify(constructNodesList('0x1', archipelName)), JSON.stringify([{wallet:'0x1',name:`${archipelName}-NODE-1`}]), 'Check if one wallet is passed');
        assert.equal(JSON.stringify(constructNodesList(nodesWallets, archipelName)), JSON.stringify(result), 'Check if multiple wallets are passed');
    });

    it('Check transaction get status', () => {
        assert.equal(transactionGetStatus(), 'Failed to get status.', 'Check transaction get status on undefined');
        assert.equal(transactionGetStatus({isInvalid: true}), 'Transaction is invalid.', 'Check transaction get status on invalid transaction');
        assert.equal(transactionGetStatus({isDropped: true}), 'Transaction is dropped.', 'Check transaction get status on dropped transaction');
        assert.equal(transactionGetStatus({isUsurped: true}), 'Transaction is usurped.', 'Check transaction get status on usurped transaction');
        assert.equal(transactionGetStatus({isReady: true}), 'Transaction is ready.', 'Check transaction get status on ready transaction');
        assert.equal(transactionGetStatus({isFuture: true}), 'Transaction is future.', 'Check transaction get status on future transaction');
        assert.equal(transactionGetStatus({isFinalized: true}), 'Transaction is finalized.', 'Check transaction get status on finalized transaction');
        assert.equal(transactionGetStatus({isBroadcast: true}), 'Transaction is broadcast.', 'Check transaction get status on broadcast transaction');
        assert.equal(transactionGetStatus({isInBlock: true}), 'Transaction is included in block.', 'Check transaction get status when included in block');
        assert.equal(transactionGetStatus({isRetracted: true}), 'Transaction is retracted.', 'Check if transaction get status when retracted');
        assert.equal(transactionGetStatus({isFinalityTimeout: true}), 'Transaction is finality timeout.', 'Check if transaction get status when finality timeout');
        assert.equal(transactionGetStatus({toto: true}), 'Unknown transaction state.', 'Check transaction get status on unknown transaction');
    });

    // Testing exit signals processing
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(SIGNAL => {
        describe(`Testing signal ${ SIGNAL }`, () => {
            let sandbox, serviceCleanUpStub, exitStub;

            beforeEach(() => {
                sandbox   = sinon.createSandbox();
                exitStub  = sandbox.stub(process, 'exit');
                serviceCleanUpStub = sinon.fake();
                catchExitSignals(serviceCleanUpStub);
            });

            afterEach(() => {
                sandbox.restore();
            });

            it(`should call 'serviceCleanUpStub' when receiving a ${ SIGNAL }`, (done) => {
                process.once(SIGNAL, () => {
                    sinon.assert.calledOnce(serviceCleanUpStub);
                    done();
                });
                process.kill(process.pid, SIGNAL);
            });
        });
    });    
});
