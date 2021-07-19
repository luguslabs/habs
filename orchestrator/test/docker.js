/* eslint-disable */

const { Docker } = require('../docker');

// Test configuration
const activeName = 'nginx-active';
const passiveName = 'nginx-passive';
const image = 'nginx';
const volume = 'nginx';
const mountDir = '/usr/share/nginx/html';
const command = ['nginx-debug', '-g', 'daemon off;'];
const jestTimeout = 30000;
let docker;

beforeEach(async () => {
  // Set jest callback timeout
  jest.setTimeout(jestTimeout);

  // Creating Docker instance
  docker = new Docker();
});

afterEach(async () => {
  await docker.removeContainer(activeName);
  await docker.removeContainer(passiveName);
});

test('Start active docker container', async () => {
  await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

  const container = await docker.getContainer(activeName);
  const containerInspect = await container.inspect();

  expect(containerInspect.Name).toBe(`/${activeName}`);
  expect(containerInspect.State.Running).toBe(true);
  expect(containerInspect.Mounts[0].Name).toBe(volume);
  expect(containerInspect.Mounts[0].Destination).toBe(mountDir);
  expect(containerInspect.Config.Image).toBe(image);
  expect(containerInspect.Config.Cmd).toStrictEqual(command);

  await docker.removeContainer(activeName);
});

test('Start passive docker container', async () => {
  await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);

  const container = await docker.getContainer(passiveName);
  const containerInspect = await container.inspect();

  expect(containerInspect.Name).toBe(`/${passiveName}`);
  expect(containerInspect.State.Running).toBe(true);
  expect(containerInspect.Mounts[0].Name).toBe(volume);
  expect(containerInspect.Mounts[0].Destination).toBe(mountDir);
  expect(containerInspect.Config.Image).toBe(image);
  expect(containerInspect.Config.Cmd).toStrictEqual(command);

  await docker.removeContainer(passiveName);
});

test('Docker container remove', async () => {
  await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

  let container = await docker.getContainer(activeName);
  const containerInspect = await container.inspect();

  expect(containerInspect.State.Running).toBe(true);

  await docker.removeContainer(passiveName);

  try {
    container = await docker.getContainer(activeName);
    await container.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-active '));
  }
});

test('Check if active container will be down after the passive container launch', async () => {
  await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);
  await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);

  try {
    const containerActive = await docker.getContainer(activeName);
    await containerActive.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-active '));
  }

  const containerPassive = await docker.getContainer(passiveName);
  const passiveInspect = await containerPassive.inspect();

  expect(passiveInspect.State.Running).toBe(true);

  await docker.removeContainer(passiveName);
});

test('Check if passive container will be down after the active container launch', async () => {
  await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);
  await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

  try {
    const containerPassive = await docker.getContainer(passiveName);
    await containerPassive.inspect();
  } catch (error) {
    expect(error).toStrictEqual(new Error('(HTTP code 404) no such container - No such container: nginx-passive '));
  }

  const containerActive = await docker.getContainer(activeName);
  const activeInspect = await containerActive.inspect();

  expect(activeInspect.State.Running).toBe(true);

  await docker.removeContainer(activeName);
});

test('Execute a command in docker container', async () => {
  await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

  const commandToExecute = ['echo', 'Hello world'];

  const result = await docker.dockerExecute(activeName, commandToExecute);

  expect(result).toBe('Hello world');
});
