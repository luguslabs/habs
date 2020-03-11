const { runCli } = require('./cli');
const figlet = require('figlet');
const debug = require('debug')('main');

const welcomeMessage = () => {
    console.log(
        figlet.textSync('Archipel CLI', { horizontalLayout: 'full' })
    );
    console.log('Welcome to Archipel CLI!');
}

async function main () {
    try {

        welcomeMessage();
        await runCli(process.argv);

    } catch (error) {
        debug('main()', error);
        throw error;
    }
}

main();