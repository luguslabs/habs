const debug = require('debug')('heartbeats');

// Heartbeats class to simplify heartbeats management
class Heartbeats {
  constructor (nodes = []) {
    this.heartbeats = new Map();
    this.nodes = nodes;
  }

  // Add heartbeat into Map
  addHeartbeat (wallet, group, nodeStatus, blockNumber) {
    let name = '';

    // Get node name from nodes array
    const node = this.nodes.find(element => element.wallet === wallet);
    if (node !== undefined) {
      name = node.name;
    }

    debug('addHeartbeat', `name ${name} group ${group} nodeStatus ${nodeStatus} blockNumber ${blockNumber}.`);
    var nodeHeartbeat = {
      name,
      group,
      nodeStatus,
      blockNumber
    };

    this.heartbeats.set(wallet, nodeHeartbeat);
  }

  // If any node in Map is alive
  anyOneAlive (excludeNode, aliveTime, group, bestNumber) {
    debug('anyOneAlive', `excludeNode ${excludeNode} aliveTime ${aliveTime} group ${group} bestNumber ${bestNumber}.`);
    for (const [key, value] of this.heartbeats.entries()) {
      if (key !== excludeNode) {
        debug('anyOneAlive', `heartbeat found. key:${key}, group:${value.group}, blockNumber:${value.blockNumber}.`);
        if (value.group === group) {
          const lastSeenAgo = bestNumber - value.blockNumber;
          if (lastSeenAgo < aliveTime) {
            debug('anyOneAlive', `${key} is alive.`);
            return true;
          }
        }
      }
    }
    return false;
  }

  // Get all heartbeats from heartbeat map
  getAllHeartbeats () {
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

    // Return sorted result by node name
    return result.sort((el1, el2) => {
      return el1.name.toString().localeCompare(el2.name.toString());
    });
  }

  // Get getHeartbeat of a node
  getHeartbeat (wallet) {
    return this.heartbeats.get(wallet);
  }
};

module.exports = {
  Heartbeats
};
