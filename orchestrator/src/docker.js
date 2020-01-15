const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Docker image pull progress
const onProgress = event => {
  if (event.progress) console.log(event.progress);
};

// Docker pull promise
const dockerPull = async image => new Promise((resolve, reject) => {
  // Pulling docker image
  docker.pull(image, (error, stream) => {
    console.log(`Pulling ${image} image...`);
    if (error) reject(error);
    // Following pull progress
    docker.modem.followProgress(stream, error => {
      if (error) reject(error);
      console.log('Image was successfully pulled.');
      resolve(true);
    }, onProgress);
  });
});

// Gets container instance by name
const getContainerByName = async name => {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers.find(element => {
      return element.Names[0] === '/' + name ? element : false;
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Gets volume instance by name
const getVolumeByName = async name => {
  try {
    const volumes = await docker.listVolumes();
    return volumes.Volumes.find(element => {
      return element.Name === name ? element : false;
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Starts container with special config
const startContainer = async containerData => {
  try {
    // Pulling image
    await dockerPull(containerData.Image);

    // Starting container
    console.log('Creating and starting container...');
    const container = await docker.createContainer(containerData);
    await container.start();

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Creating validator volume
const createVolume = async name => {
  try {
    const volume = await getVolumeByName(name);
    if (volume === undefined) {
      const options = {
        Name: name
      };
      await docker.createVolume(options);
      return true;
    } else {
      console.log('Volume already exists.');
      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const prepareAndStart = async (containerData, upName, downName, containerUp, containerDown) => {
  // Settng container name
  containerData.name = upName;

  // We must stop down container if necessary
  if (containerDown !== undefined) {
    console.log(`Stopping ${downName} container...`);
    await removeContainer(downName);
  }

  if (containerUp === undefined) {
    // Starting container
    console.log(`Starting ${upName} container...`);
    await startContainer(containerData);
    return true;
  } else {
    // If container exits but is not in running state
    // We will stop and restart it
    if (containerUp.State !== 'running') {
      console.log(`Restarting container ${containerData.name}...`);
      await removeContainer(containerData.name);
      await startContainer(containerData);
    }

    console.log('Service is already started.');
    return false;
  }
};

// Starting container
const startServiceContainer = async (type, activeName, passiveName, image, cmd, mountTarget, mountSource) => {
  try {
    // Creating volume
    await createVolume(mountSource);

    // Constructing container data
    const containerData = {
      name: '',
      Image: image,
      Cmd: cmd,
      HostConfig: {
        Mounts: [
          {
            Target: mountTarget,
            Source: mountSource,
            Type: 'volume',
            ReadOnly: false
          }
        ]
      }
    };

    // Get passive and active containers
    const containerPassive = await getContainerByName(passiveName);
    const containerActive = await getContainerByName(activeName);

    // If we want to start active container
    if (type === 'active') {
      return await prepareAndStart(containerData, activeName, passiveName, containerActive, containerPassive);
    // We want to start passive container
    } else {
      return await prepareAndStart(containerData, passiveName, activeName, containerPassive, containerActive);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Stopping validator node
const removeContainer = async name => {
  try {
    const containerByName = await getContainerByName(name);
    console.log(`Deleting container ${name}...`);
    if (containerByName !== undefined) {
      const container = await docker.getContainer(containerByName.Id);
      await container.remove({ force: true });
      return true;
    } else {
      console.log(`Container ${name} was not found.`);
      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  startServiceContainer,
  removeContainer,
  getContainerByName
};
