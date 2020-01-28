const Docker = require('dockerode');
const { startServiceContainer, dockerExecute, removeContainer } = require('../docker');
console.log('Node version:', process.version);

// Config
const activeName = 'nginx-active';
const passiveName = 'nginx-passive';
const image = 'nginx';
const volume = 'nginx';
const mountDir = '/usr/share/nginx/html';
const command = ['nginx-debug', '-g', 'daemon off;'];
const jestTimeout = 30000;
let docker;

beforeAll(async () => {
  // Set jest callback timeout
  jest.setTimeout(jestTimeout);

  // Creating Docker instance
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
});

afterAll(async () => {
  await removeContainer(docker, activeName);
  await removeContainer(docker, passiveName);
});

test('Start active docker container', async () => {
  await startServiceContainer(docker, 'active', activeName, passiveName, image, command, mountDir, volume);

  const container = await docker.getContainer(activeName);
  const containerInspect = await container.inspect();

  expect(containerInspect.Name).toBe(`/${activeName}`);
  expect(containerInspect.State.Running).toBe(true);
  expect(containerInspect.Mounts[0].Name).toBe(volume);
  expect(containerInspect.Mounts[0].Destination).toBe(mountDir);
  expect(containerInspect.Config.Image).toBe(image);
  expect(containerInspect.Config.Cmd).toStrictEqual(command);

  await removeContainer(docker, activeName);
});

test('Start passive docker container', async () => {
  await startServiceContainer(docker, 'passive', activeName, passiveName, image, command, mountDir, volume);

  const container = await docker.getContainer(passiveName);
  const containerInspect = await container.inspect();

  expect(containerInspect.Name).toBe(`/${passiveName}`);
  expect(containerInspect.State.Running).toBe(true);
  expect(containerInspect.Mounts[0].Name).toBe(volume);
  expect(containerInspect.Mounts[0].Destination).toBe(mountDir);
  expect(containerInspect.Config.Image).toBe(image);
  expect(containerInspect.Config.Cmd).toStrictEqual(command);

  await removeContainer(docker, passiveName);
});

test('Docker container remove', async () => {
  await startServiceContainer(docker, 'active', activeName, passiveName, image, command, mountDir, volume);

  let container = await docker.getContainer(activeName);
  const containerInspect = await container.inspect();

  expect(containerInspect.State.Running).toBe(true);

  await removeContainer(docker, passiveName);

  try {
    container = await docker.getContainer(activeName);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-active '));
  }
});

test('Check if active container will be down after the passive container launch', async () => {
  await startServiceContainer(docker, 'active', activeName, passiveName, image, command, mountDir, volume);
  await startServiceContainer(docker, 'passive', activeName, passiveName, image, command, mountDir, volume);

  try {
    const containerActive = await docker.getContainer(activeName);
    await containerActive.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-active '));
  }

  const containerPassive = await docker.getContainer(passiveName);
  const passiveInspect = await containerPassive.inspect();

  expect(passiveInspect.State.Running).toBe(true);

  await removeContainer(docker, passiveName);
});

test('Check if passive container will be down after the active container launch', async () => {
  await startServiceContainer(docker, 'passive', activeName, passiveName, image, command, mountDir, volume);
  await startServiceContainer(docker, 'active', activeName, passiveName, image, command, mountDir, volume);

  try {
    const containerPassive = await docker.getContainer(passiveName);
    await containerPassive.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-passive '));
  }

  const containerActive = await docker.getContainer(activeName);
  const activeInspect = await containerActive.inspect();

  expect(activeInspect.State.Running).toBe(true);

  await removeContainer(docker, activeName);
});

test.only('Execute a command in docker container', async () => {
  await startServiceContainer(docker, 'active', activeName, passiveName, image, command, mountDir, volume);

  const commandToExecute = ['echo', 'Hello world'];

  const result = await dockerExecute(docker, activeName, commandToExecute);

  expect(result).toBe('Hello world');
});
