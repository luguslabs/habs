const Dockerode = require('dockerode');
const debug = require('debug')('docker');

const { streamToString } = require('./utils');

class Docker {
  constructor () {
    try {
      this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
    } catch (error) {
      debug('constructor', error);
      throw error;
    }
  }

  // Pull docker image progress
  static onProgress (event) {
    if (event.progress) console.log(event.progress);
  }

  // Pull docker image
  async dockerPull (image) {
    return new Promise((resolve, reject) => {
      // Pulling docker image
      this.docker.pull(image, (error, stream) => {
        console.log(`Pulling ${image} image...`);
        if (error) return reject(error);
        // Following pull progress
        this.docker.modem.followProgress(stream, error => {
          if (error) return reject(error);
          console.log('Image was successfully pulled.');
          return resolve(true);
        }, Docker.onProgress);
      });
    });
  }

  // Execute a command in a docker container
  async dockerExecute (name, command) {
    try {
      // Get container instance
      const container = this.docker.getContainer(name);

      // Exec a command and get a stream
      const exec = await container.exec({ Cmd: command, AttachStdin: true, AttachStdout: true });
      const stream = await exec.start();

      // Convert stream to a string to return it
      return await streamToString(stream);
    } catch (error) {
      debug('dockerExecute', error);
      console.error(error);
      return false;
    }
  }

  // Get container instance by name
  async getContainerByName (name) {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers.find(element => {
        return element.Names[0] === '/' + name ? element : false;
      });
    } catch (error) {
      debug('getContainerByName', error);
      throw error;
    }
  }

  // return true if container is running
  async isContainerRunningByName (name) {
    let result = false;
    try {
      const container = await this.getContainerByName(name);
      if (container && container.State === 'running') {
        result = true;
      }
    } catch (e) {
      result = false;
    }
    return result;
  }

  // Get volume instance by name
  async getVolumeByName (name) {
    try {
      const volumes = await this.docker.listVolumes();
      return volumes.Volumes.find(element => {
        return element.Name === name ? element : false;
      });
    } catch (error) {
      debug('getVolumeByName', error);
      throw error;
    }
  }

  // Pulling image, creating and starting a container
  async startContainer (containerData) {
    try {
      // Pulling image
      await this.dockerPull(containerData.Image);

      // Starting container
      console.log('Creating and starting container...');
      const container = await this.docker.createContainer(containerData);
      await container.start();

      return true;
    } catch (error) {
      debug('startContainer', error);
      throw error;
    }
  };

  // Creating a volume
  async createVolume (name) {
    try {
      const volume = await this.getVolumeByName(name);
      if (volume === undefined) {
        const options = {
          Name: name
        };
        await this.docker.createVolume(options);
        return true;
      } else {
        debug('createVolume', 'Volume already exists.');
        return false;
      }
    } catch (error) {
      debug('createVolume', error);
      throw error;
    }
  }

  // Prune volumes
  async pruneVolumes (name) {
    try {
      const volume = await this.getVolumeByName(name);
      if (volume !== undefined) {
        const options = {
          Name: name
        };
        await this.docker.pruneVolumes(options);
        return true;
      } else {
        debug('pruneVolumes', 'Volume do not exist.');
        return false;
      }
    } catch (error) {
      debug('pruneVolumes', error);
      throw error;
    }
  }

  // Remove 'down' container and start 'up' container
  async prepareAndStart (containerData, upName, downName) {
    try {
      // Get passive and active containers
      const containerUp = await this.getContainerByName(upName);
      const containerDown = await this.getContainerByName(downName);

      // Setting container name
      containerData.name = upName;

      // We must stop down container if necessary
      if (containerDown !== undefined) {
        console.log(`Stopping ${downName} container...`);
        await this.removeContainer(downName);
      }

      if (containerUp === undefined) {
        // Starting container
        console.log(`Starting ${upName} container...`);
        await this.startContainer(containerData);
        return true;
      } else {
        // If container exits but is not in running state
        // We will stop and restart it
        if (containerUp.State !== 'running') {
          console.log(`Restarting container ${containerData.name}...`);
          await this.removeContainer(containerData.name);
          await this.startContainer(containerData);
        }

        console.log('Service is already started.');
        return false;
      }
    } catch (error) {
      debug('prepareAndStart', error);
      throw error;
    }
  };

  // Start passive or active service container
  async startServiceContainer (type, activeName, passiveName, image, cmd, mountTarget, mountSource, networkMode) {
    try {
      // Check if active service container is already running
      if (type === 'active' && await this.isContainerRunningByName(activeName)) {
        console.log(`Service is already running in ${type} mode...`);
        return;
      }

      // Check if passive service container is already running
      if ((type === 'passive' || type === 'sentry') && await this.isContainerRunningByName(passiveName)) {
        console.log(`Service is already running in ${type} mode...`);
        return;
      }

      // Creating volume
      await this.createVolume(mountSource);

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

      if (networkMode !== '') {
        containerData.HostConfig.NetworkMode = networkMode;
      }

      // If we want to start active container
      if (type === 'active') {
        return await this.prepareAndStart(containerData, activeName, passiveName);
      // We want to start passive container
      } else {
        return await this.prepareAndStart(containerData, passiveName, activeName);
      }
    } catch (error) {
      debug('startServiceContainer', error);
      throw error;
    }
  }

  // Stop and remove container
  async removeContainer (name) {
    try {
      const containerByName = await this.getContainerByName(name);
      console.log(`Deleting container ${name}...`);
      if (containerByName !== undefined) {
        const container = await this.docker.getContainer(containerByName.Id);
        await container.remove({ force: true });
        return true;
      } else {
        console.log(`Container ${name} was not found.`);
        return false;
      }
    } catch (error) {
      debug('removeContainer', error);
      throw error;
    }
  }

  async getContainer (name) {
    try {
      return this.docker.getContainer(name);
    } catch (error) {
      debug('getContainer', error);
      throw error;
    }
  }

  async getContainerById (nameOrId) {
    try {
      const containers = await this.docker.listContainers({ all: true });
      // return containers;
      return containers.find(element => {
        return element.Id.startsWith(nameOrId) || (element.Names.length > 0 && element.Names[0].includes(nameOrId)) ? element : false;
      });
    } catch (error) {
      debug('getContainerById', error);
      throw error;
    }
  }

  async getMountThatContains (nameOrId, str) {
    try {
      const container = await this.getContainerById(nameOrId);

      if (container) {
        return container.Mounts.find(element => {
          if ('Name' in element) {
            return element.Name.includes(str) ? element : false;
          }
        });
      }
      return false;
    } catch (error) {
      debug('getContainerById', error);
      throw error;
    }
  }
};

module.exports = {
  Docker
};
