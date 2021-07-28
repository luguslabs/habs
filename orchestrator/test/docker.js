/* eslint-disable */
const { assert } = require('chai');
const { Docker } = require('../src/docker');

// Test configuration
let docker;
const testTimeout = 60000;
const activeName = 'nginx-active';
const passiveName = 'nginx-passive';
const image = 'nginx:latest';
const volume = 'nginx';
const mountDir = '/usr/share/nginx/html';
const command = ['nginx-debug', '-g', 'daemon off;'];
const testingImage = 'nginx:1.20';
const testingVolume = 'test-volume-3';

describe('Docker test', function(){
  this.timeout(testTimeout);
  before(async function() {
    // Creating Docker instance
    docker = new Docker();
  });

  after(async function() {
    await docker.removeContainer(activeName);
    await docker.removeContainer(passiveName);
    await docker.removeImage(testingImage);
    await docker.removeVolume(testingVolume);
  });

  it('Test docker image functionality', async function () {
    let image = await docker.getImage(testingImage);
    assert.equal(image, false, 'check if docker image is not already present at host');

    let pullImage = await docker.pullImage(testingImage);
    assert.equal(pullImage, true, 'check pull image result');
    pullImage = await docker.pullImage(testingImage);
    assert.equal(pullImage, true, 'trying to repull image if image already exists');

    image = await docker.getImage(testingImage);
    assert.notEqual(image, false, 'check if docker image was successfully pulled');

    let removeImage = await docker.removeImage(testingImage);
    assert.equal(removeImage, true, 'check remove image result');
    removeImage = await docker.removeImage(testingImage);
    assert.equal(removeImage, false, 'trying to remove already removed image');

    image = await docker.getImage(testingImage);
    assert.equal(image, false, 'check if docker image was correctly removed');
  });

  it('Test docker volume functionality', async function () {
    let volume = await docker.getVolume(testingVolume);
    assert.equal(volume, false, 'check if docker volume doesnt exist');

    let volumeCreation = await docker.createVolume(testingVolume);
    assert.equal(volumeCreation, true, 'check volume creation result');
    volumeCreation = await docker.createVolume(testingVolume);
    assert.equal(volumeCreation, false, 'check if volume already exists');

    volume = await docker.getVolume(testingVolume);
    assert.notEqual(volume, false, 'check if docker volume was created');

    let volumeRemove = await docker.removeVolume(testingVolume);
    assert.equal(volumeRemove, true, 'check volume removal result');
    volumeRemove = await docker.removeVolume(testingVolume);
    assert.equal(volumeRemove, false, 'trying to remove volume if it was already removed');

    volume = await docker.getVolume(testingVolume);
    assert.equal(volume, false, 'check if docker volume was removed');
  });

  it('Test docker container functionality', async function () {
    let container = await docker.getContainer(activeName);
    assert.equal(container, false, 'check if docker container doesnt exist');

    let containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');

    const containerData = {
      name: activeName,
      Image: image,
      Cmd: command,
      HostConfig: {
        Mounts: [
          {
            Target: mountDir,
            Source: volume,
            Type: 'volume',
            ReadOnly: false
          }
        ]
      }
    };

    await docker.createVolume(volume);

    let startContainer = await docker.startContainer(containerData);
    assert.equal(startContainer, true, 'check start container result');
    startContainer = await docker.startContainer(containerData);
    assert.equal(startContainer, false, 'trying to start already started container');

    container = await docker.getContainer(activeName);
    assert.equal(container.description.Name, `/${activeName}`, 'check if docker container has a correct name after creation');
    assert.equal(container.description.State.Running, true, 'check if docker container is in running state');
    assert.equal(container.description.Mounts[0].Name, volume, 'check if docker container has a correct volume attached');
    assert.equal(container.description.Mounts[0].Destination, mountDir, 'check if docker container has a correct mount dir');
    assert.equal(container.description.Config.Image, image, 'check if docker container has a correct image');
    assert.equal(container.description.Config.Cmd.join(' '), command.join(' '), 'check if docker container has a correct command');
   
    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, true, 'check if docker container is running');

    let getMount = await docker.getMount(activeName, volume);
    assert.notEqual(getMount, false, 'check if mount was found');
    getMount = await docker.getMount(activeName, 'invalid-mount');
    assert.equal(getMount, false, 'check not existing mount');

    const commandToExecute = ['echo', 'Hello world'];
    let result = await docker.dockerExecute(activeName, commandToExecute);
    assert.equal(result, 'Hello world', 'check if command was executed in docker container and output can be retrieved');

    let stopContainer = await docker.stopContainer(activeName);
    assert.equal(stopContainer, true, 'check if stop container result');
    stopContainer = await docker.stopContainer(activeName);
    assert.equal(stopContainer, false, 'stopping already stopped container');
    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');
    startContainer = await docker.startContainer(containerData);
    assert.equal(startContainer, true, 'trying to start stopped container');
    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, true, 'check if docker container is running');

    let containerRemove = await docker.removeContainer(activeName);
    assert.equal(containerRemove, true, 'check container remove result');
    containerRemove = await docker.removeContainer(activeName);
    assert.equal(containerRemove, false, 'trying to remove already removed container');

    stopContainer = await docker.stopContainer(activeName);
    assert.equal(stopContainer, false, 'trying to stop removed container');

    result = await docker.dockerExecute(activeName, commandToExecute);
    assert.equal(result, false, 'trying to execute command in removed container');

    getMount = await docker.getMount(activeName, volume);
    assert.equal(getMount, false, 'get mount from removed container');

    container = await docker.getContainer(activeName);
    assert.equal(container, false, 'check if docker container was successfully removed');

    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');

    let volumeRemove = await docker.removeVolume(volume);
    assert.equal(volumeRemove, true, 'check volume removal result');

    let removeImage = await docker.removeImage(image);
    assert.equal(removeImage, true, 'check remove image result');
  });
  it('Test docker image pull when starting container', async function() {

    let container = await docker.getContainer(activeName);
    assert.equal(container, false, 'check if docker container doesnt exist');

    let containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');

    const containerData = {
      name: activeName,
      Image: image,
      Cmd: command,
      HostConfig: {
        Mounts: [
          {
            Target: mountDir,
            Source: volume,
            Type: 'volume',
            ReadOnly: false
          }
        ]
      }
    };

    await docker.createVolume(volume);

    let startContainer = await docker.startContainer(containerData);
    assert.equal(startContainer, true, 'check start container result');

    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, true, 'check if docker container is running');

    let removeContainer = await docker.removeContainer(activeName);
    assert.equal(removeContainer, true, 'check if docker container removal is ok');

    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');

    // Trying to start container with wrong image
    containerData.Image = "nginx:wrong-image-version";

    startContainer = await docker.startContainer(containerData);
    assert.equal(startContainer, false, 'check start container fails');

    containerRunnig = await docker.isContainerRunning(activeName);
    assert.equal(containerRunnig, false, 'check if docker container is not running');

    let volumeRemove = await docker.removeVolume(volume);
    assert.equal(volumeRemove, true, 'check volume removal result');
    let removeImage = await docker.removeImage(image);
    assert.equal(removeImage, true, 'check remove image result');
  });

  it('Check docker functions fails', async () => {
    const saveGetImage = docker.getImage;
    docker.getImage = async () => { throw Error('Test error throw'); }

    let result = await docker.removeImage('toto');
    assert.equal(result, false, 'check if remove image is false cause get image will throw an error');

    docker.getImage = saveGetImage;

    const saveGetVolume = docker.getVolume;
    docker.getVolume = async () => { throw Error('Test error throw'); }

    result = await docker.createVolume('toto');

    assert.equal(result, false, 'check if create volume is false cause get volume throws an error');

    result = await docker.removeVolume('toto');

    assert.equal(result, false, 'check if remove volume is false cause get volume throws an error');

    docker.getVolume = saveGetVolume;

    const saveDockerListContainers = docker.docker.listContainers;

    docker.docker.listContainers = async () => { throw Error('Test error throw'); }

    result = await docker.getContainer('toto');

    assert.equal(result, false, 'check if get container is false cause docker list containers throws an error');

    docker.docker.listContainers = saveDockerListContainers;

    const saveGetContainer = docker.getContainer;

    docker.getContainer = async () => { throw Error('Test error throw'); }

    result = await docker.startContainer();
    assert.equal(result, false, 'check if start container is false cause get container throws an error');

    result = await docker.removeContainer();
    assert.equal(result, false, 'check if remove container is false cause get container throws an error');

    result = await docker.isContainerRunning();
    assert.equal(result, false, 'check if is container running is false cause get container throws an error');

    result = await docker.getMount();
    assert.equal(result, false, 'check if get mount is false cause get container throws an error');

    result = await docker.dockerExecute();
    assert.equal(result, false, 'check if docker execute is false cause get container throws an error');

    docker.getContainer = saveGetContainer;

  });
});
