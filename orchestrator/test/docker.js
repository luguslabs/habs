/* eslint-disable */
const { assert } = require('chai');
const { Docker } = require('../src/docker');

// Test configuration
let docker;
const testTimeout = 60000;
const activeName = 'nginx-active';
const passiveName = 'nginx-passive';
const image = 'nginx';
const volume = 'nginx';
const mountDir = '/usr/share/nginx/html';
const command = ['nginx-debug', '-g', 'daemon off;'];

describe('Docker test', function(){
  this.timeout(testTimeout);
  before(async function() {
    // Creating Docker instance
    docker = new Docker();
  });

  after(async function() {
    await docker.removeContainer(activeName);
    await docker.removeContainer(passiveName);
  });

  it('Test active docker container start', async function () {
    await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

    const container = await docker.getContainer(activeName);
    const containerInspect = await container.inspect();

    assert.equal(containerInspect.Name, `/${activeName}`, 'check if docker container has a correct name after creation');
    assert.equal(containerInspect.State.Running, true, 'check if docker container is in running state');
    assert.equal(containerInspect.Mounts[0].Name, volume, 'check if docker container has a correct volume attached');
    assert.equal(containerInspect.Mounts[0].Destination, mountDir, 'check if docker container has a correct mount dir');
    assert.equal(containerInspect.Config.Image, image, 'check if docker container has a correct image');
    assert.equal(containerInspect.Config.Cmd.join(' '), command.join(' '), 'check if docker container has a correct command');
  
    await docker.removeContainer(activeName);
  });

  it('Test passive docker container start', async function () {
    await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);

    const container = await docker.getContainer(passiveName);
    const containerInspect = await container.inspect();

    assert.equal(containerInspect.Name, `/${passiveName}`, 'check if docker container has a correct name after creation');
    assert.equal(containerInspect.State.Running, true, 'check if docker container is in running state');
    assert.equal(containerInspect.Mounts[0].Name, volume, 'check if docker container has a correct volume attached');
    assert.equal(containerInspect.Mounts[0].Destination, mountDir, 'check if docker container has a correct mount dir');
    assert.equal(containerInspect.Config.Image, image, 'check if docker container has a correct image');
    assert.equal(containerInspect.Config.Cmd.join(' '), command.join(' '), 'check if docker container has a correct command');
  
    await docker.removeContainer(passiveName);
  });

  it('Test docker container remove', async function () {
    await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

    let container = await docker.getContainer(activeName);
    const containerInspect = await container.inspect();
  
    assert.equal(containerInspect.State.Running, true, 'check if docker container is in running state');
  
    await docker.removeContainer(activeName);
  
    try {
      container = await docker.getContainer(activeName);
      await container.inspect();
    } catch (error) {
      assert.equal(error.toString(), 'Error: (HTTP code 404) no such container - No such container: nginx-active ', 'check if docker container was removed');
    }
  });

  it('Test if active container will be down after the passive container launch', async function () {
    await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);
    await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);

    const containerPassive = await docker.getContainer(passiveName);
    const passiveInspect = await containerPassive.inspect();
  
    assert.equal(passiveInspect.State.Running, true, 'check if passive docker container is in running state');
  
    try {
      const containerActive = await docker.getContainer(activeName);
      await containerActive.inspect();
    } catch (error) {
      assert.equal(error.toString(), 'Error: (HTTP code 404) no such container - No such container: nginx-active ', 'check if active docker container was removed');
    }
  
    await docker.removeContainer(passiveName);
  });

  it('Test if passive container will be down after the active container launch', async function () {
    await docker.startServiceContainer('passive', activeName, passiveName, image, command, mountDir, volume);
    await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);
  
    const containerActive = await docker.getContainer(activeName);
    const activeInspect = await containerActive.inspect();

    assert.equal(activeInspect.State.Running, true, 'check if active docker container is in running state');

    try {
      const containerPassive = await docker.getContainer(passiveName);
      await containerPassive.inspect();
    } catch (error) {
      assert.equal(error.toString(), 'Error: (HTTP code 404) no such container - No such container: nginx-passive ', 'check if passive docker container was removed');
    }
  
    await docker.removeContainer(activeName);
  });

  it('Test command execution in docker container', async function () {
    await docker.startServiceContainer('active', activeName, passiveName, image, command, mountDir, volume);

    const commandToExecute = ['echo', 'Hello world'];
  
    const result = await docker.dockerExecute(activeName, commandToExecute);
  
    assert.equal(result, 'Hello world', 'check if command was executed in docker container and output can be retrieved');
  });

});
