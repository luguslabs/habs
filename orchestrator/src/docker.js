const Dockerode = require('dockerode');
const debug = require('debug')('docker');

const { streamToString } = require('./utils');

class Docker {
  constructor (socketPath = '/var/run/docker.sock') {
    this.docker = new Dockerode({ socketPath });
  }

  // Get docker image instance
  async getImage (imageName) {
    try {
      const imageInstance = await this.docker.getImage(imageName);
      imageInstance.description = await imageInstance.inspect();
      return imageInstance || false;
    } catch (error) {
      debug('getImage', error);
      return false;
    }
  }

  // Pull docker image
  async pullImage (image) {
    try {
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
          }, (event) => {
            if (event.progress) console.log(event.progress);
          });
        });
      });
    } catch (error) {
      debug('pullImage', error);
      return false;
    }
  }

  // Remove image
  async removeImage (imageName) {
    try {
      const imageInstance = await this.getImage(imageName);
      if (imageInstance) {
        await imageInstance.remove({ force: true });
        return true;
      }
      return false;
    } catch (error) {
      debug('removeImage', error);
      return false;
    }
  }

  // Get volume instance by name
  async getVolume (name) {
    try {
      const volume = await this.docker.getVolume(name);
      volume.description = await volume.inspect();
      return volume || false;
    } catch (error) {
      debug('getVolume', error);
      return false;
    }
  }

  // Creating a volume
  async createVolume (name) {
    try {
      const volume = await this.getVolume(name);
      if (!volume) {
        await this.docker.createVolume({ Name: name });
        return true;
      } else {
        debug('createVolume', 'Volume already exists.');
        return false;
      }
    } catch (error) {
      debug('createVolume', error);
      return false;
    }
  }

  // Remove volume
  async removeVolume (name) {
    try {
      const volume = await this.getVolume(name);
      if (volume) {
        await volume.remove();
        return true;
      }
      return false;
    } catch (error) {
      debug('removeVolume', error);
      return false;
    }
  }

  // Get container instance by id or name
  async getContainer (nameOrId) {
    try {
      // List all available containers on host
      const containers = await this.docker.listContainers({ all: true });

      // Search a container by its name or id
      const foundContainer = containers.find(container => {
        return container.Id === nameOrId || (container.Names.length > 0 && container.Names[0] === '/' + nameOrId) ? container : false;
      });

      // Get container instance
      const containerInstance = foundContainer && foundContainer.Id ? await this.docker.getContainer(foundContainer.Id) : false;

      // Save container description in container instance
      if (containerInstance) {
        containerInstance.description = await containerInstance.inspect();
      }

      // Merging container instance and container info
      return containerInstance;
    } catch (error) {
      debug('getContainer', error);
      return false;
    }
  }

  // Pulling image, creating and starting a container
  async startContainer (containerData) {
    try {
      const container = await this.getContainer(containerData.name);

      // If container doesnt exist we will create one
      if (!container) {
        // Pulling image
        await this.pullImage(containerData.Image);

        // Starting container
        debug('startContainer', `Creating and starting container ${containerData.Name}.`);
        const newContainer = await this.docker.createContainer(containerData);
        await newContainer.start();
        return true;
      }

      // If container exists but is not running trying to just start it
      if (container && !container.description.State.Running) {
        await container.start();
        return true;
      }

      // If container exists and is running just sending false
      debug('startContainer', `Container ${containerData.Name} already exists and is running.`);
      return false;
    } catch (error) {
      debug('startContainer', error);
      return false;
    }
  };

  // Stop a container
  async stopContainer (nameOrId) {
    try {
      const container = await this.getContainer(nameOrId);
      debug('stopContainer', `Stopping container ${nameOrId}...`);
      if (container) {
        await container.stop();
        return true;
      }
      debug('stopContainer', `Container ${nameOrId} was not found.`);
      return false;
    } catch (error) {
      debug('stopContainer', error);
      return false;
    }
  }

  // Stop a container
  async removeContainer (nameOrId) {
    try {
      const container = await this.getContainer(nameOrId);
      debug('removeContainer', `Deleting container ${nameOrId}...`);
      if (container) {
        await container.remove({ force: true });
        return true;
      }
      debug('removeContainer', `Container ${nameOrId} was not found.`);
      return false;
    } catch (error) {
      debug('removeContainer', error);
      return false;
    }
  }

  // return true if container is running
  async isContainerRunning (nameOrId) {
    try {
      const container = await this.getContainer(nameOrId);
      if (container && container.description.State.Running) {
        return true;
      }
      return false;
    } catch (error) {
      debug('isContainerRunning', error);
      return false;
    }
  }

  // Get mount from a container
  async getMount (containerNameOrId, volumeName) {
    try {
      // Get container instance
      const container = await this.getContainer(containerNameOrId);

      if (container) {
        // Search for volume by name in mounts
        const mount = container.description.Mounts.find(element => {
          if ('Name' in element) {
            return element.Name.endsWith(volumeName) ? element : false;
          }
        });
        return mount || false;
      }
      return false;
    } catch (error) {
      debug('getMount', error);
      return false;
    }
  }

  // Execute a command in a docker container
  async dockerExecute (nameOrId, command) {
    try {
      // Get container instance
      const container = await this.getContainer(nameOrId);

      // Exec a command and get a stream
      if (container) {
        const exec = await container.exec({ Cmd: command, AttachStdin: true, AttachStdout: true });
        const stream = await exec.start();

        // Convert stream to a string to return it
        return await streamToString(stream);
      }
      return false;
    } catch (error) {
      debug('dockerExecute', error);
      return false;
    }
  }
};

module.exports = {
  Docker
};
