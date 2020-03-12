#!/usr/bin/env node
const figlet = require('figlet');
const debug = require('debug')('main');
const {
  runCli
} = require('./cli');

// Show a Archipel CLI figlet and welcome message
const welcomeMessage = () => {
  console.log(
    figlet.textSync('Archipel CLI', { horizontalLayout: 'full' })
  );
  console.log('Welcome to Archipel CLI!');
};

async function main () {
  try {
    welcomeMessage();
    await runCli(process.argv);
  } catch (error) {
    debug('main()', error);
    console.error(error);
    process.exit(1);
  }
}

main();
