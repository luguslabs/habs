const debug = require('debug')('metrics');

// Metrics class to simplify metrics management
class Metrics {
  constructor (nodes = []) {
    this.metrics = new Map();
    this.nodes = nodes;
  }

  // Add metrics into Map
  addMetrics (wallet, metrics, blockNumber) {
    let name = '';

    // Get node name from nodes array
    const node = this.nodes.find(element => element.wallet === wallet);
    if (node !== undefined) {
      name = node.name;
    }

    debug('nodeMetrics', `name ${name} metrics ${metrics} blockNumber ${blockNumber}.`);
    var nodeMetrics = {
      name,
      metrics,
      blockNumber
    };

    this.metrics.set(wallet, nodeMetrics);
  }

  // If any node in Map is alive
  anyOneAlive (excludeNode, aliveTime, bestNumber) {
    for (const [key, value] of this.metrics.entries()) {
      if (key !== excludeNode) {
        const lastSeenAgo = bestNumber - value.blockNumber;
        if (lastSeenAgo < aliveTime) {
          debug('metrics', `${key} is alive.`);
          return true;
        }
      }
    }
    return false;
  }

  // Get all metrics from metric map
  getAllMetrics () {
    const result = [];
    this.metrics.forEach((value, key) => {
      result.push({
        wallet: key,
        name: value.name,
        metrics: value.metrics,
        blockNumber: value.blockNumber
      });
    });

    // Return sorted result by node name
    return result.sort((el1, el2) => {
      return el1.name.toString().localeCompare(el2.name.toString());
    });
  }

  // Get metrics of a node
  getMetrics (wallet) {
    return this.metrics.get(wallet);
  }
};

module.exports = {
  Metrics
};
