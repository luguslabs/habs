const program = require('commander');
const cli = require('clui');
const debug = require('debug')('cli');

const {
    generateConfig
} = require('./generate');

const {
    initConfig
} = require('./init');

const Spinner = cli.Spinner;

// Parse Archipel CLI arguments
const runCli = async args => {
    try {
        program
            .version('0.0.1');

        program
            .command('init <service>')
            .description('Init Archipel cli config file')
            .action(service => {
                const spinner = new Spinner('Initializing Archipel CLI config file...');
                initConfig(service, spinner);
            });

        program
            .command('generate')
            .description('Generate Archipel config archive')
            .action(() => {
                const spinner = new Spinner('Generating Archipel Config Archive...');
                generateConfig(spinner);
            });

        await program.parseAsync(args);
    } catch (error) {
        debug('runCli()', error);
        throw error;
    }
}

module.exports = {
    runCli
}