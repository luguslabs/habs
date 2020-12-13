const program = require('commander');
const debug = require('debug')('cli');

const {
  generateConfig
} = require('./generate');

const {
  initConfig
} = require('./init');

// Parse Archipel CLI arguments
const runCli = async args => {
  try {
    // Set cli version
    program
      .version('2.1.2');

    // Init command
    program
      .command('init <service>')
      .description('Init Archipel cli config file')
      .action(initConfig);

    // Generate command
    program
      .command('generate')
      .description('Generate Archipel config archive')
      .action(generateConfig);

    await program.parseAsync(args);
  } catch (error) {
    debug('runCli()', error);
    throw error;
  }
};

module.exports = {
  runCli
};
