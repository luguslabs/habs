const debug = require('debug')('heartbeats');
const {
  constructNodesList
} = require('./utils');

class Heartbeats {
  constructor (nodesWallets, archipelName) {
    this.heartbeats = new Map();
    this.nodes = constructNodesList(nodesWallets, archipelName);
  }

  // Add heartbeat into Map
  addHeartbeat (wallet, group, nodeStatus, blockNumber) {
    // Get node name from nodes array
    const node = this.nodes.find(element => element.wallet === wallet);
    const name = node !== undefined ? node.name : '';

    debug('addHeartbeat', `name ${name} group ${group} nodeStatus ${nodeStatus} blockNumber ${blockNumber}.`);
    // Add heartbeat
    this.heartbeats.set(wallet,
      {
        name,
        group,
        nodeStatus,
        blockNumber: parseInt(blockNumber)
      });
  }

  // Check if anyone is alive
  anyOneAlive (excludeNode, aliveTime, group, bestNumber) {
    debug('anyOneAlive', `excludeNode ${excludeNode} aliveTime ${aliveTime} group ${group} bestNumber ${bestNumber}.`);
    // Create variables to store liveness results
    let otherNodeAlive = false;
    let currentNodeAlive = false;

    // Search in heartbeats map
    for (const [key, value] of this.heartbeats.entries()) {
      debug('anyOneAlive', `heartbeat found. key:${key}, group:${value.group}, blockNumber:${value.blockNumber}.`);
      // Check if someone was alive less blocks then aliveTime ago
      const lastSeenAgo = bestNumber - value.blockNumber;
      if (value.blockNumber !== 0 && lastSeenAgo < aliveTime) {
        debug('anyOneAlive', `${key} is alive.`);
        // Fill other node or current node liveness
        if (key !== excludeNode) {
          otherNodeAlive = true;
        } else {
          currentNodeAlive = true;
        }
      }
    }

    // One other node and current node must be alive
    return otherNodeAlive && currentNodeAlive;
  }

  // Get all heartbeats from heartbeat map
  getAllHeartbeats () {
    // Here we will create a list of objects
    const result = [];
    this.heartbeats.forEach((value, key) => {
      result.push({
        wallet: key,
        name: value.name,
        group: value.group,
        nodeStatus: value.nodeStatus,
        blockNumber: value.blockNumber
      });
    });

    // Sort and return heartbeats object list
    return result.sort((el1, el2) => {
      return el1.name.toString().localeCompare(el2.name.toString());
    });
  }

  // Get a heartbeat of a node
  getHeartbeat (wallet) {
    return this.heartbeats.get(wallet);
  }
};

module.exports = {
  Heartbeats
};
