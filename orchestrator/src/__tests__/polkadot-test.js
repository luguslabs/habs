const Docker = require('dockerode');
const { polkadotStart, polkadotCleanUp } = require('../polkadot');

// Config
const jestTimeout = 30000;
let docker;

beforeAll(async () => {
  // Set jest callback timeout
  jest.setTimeout(jestTimeout);

  // Creating Docker instance
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
});

afterAll(async () => {
  await polkadotCleanUp(docker);
});

// TODO: Write tests
test('Test active mode polkadot start', async () => {
  expect(true).toBe(true);
});
