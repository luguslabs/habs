const debug = require('debug')('metrics');

// Metrics class to simplify metrics management
class Metrics {
  constructor () {
    this.metrics = new Map();
  }

  // Add metrics into Map
  addMetrics (wallet, metrics, timestamp) {
    var nodeMetrics = {
      metrics,
      timestamp
    };

    this.metrics.set(wallet, nodeMetrics);
  }

  // If any node in Map is alive
  anyOneAlive (excludeNode, aliveTime) {
    const nowTime = new Date().getTime();
    for (const [key, value] of this.metrics.entries()) {
      if (key !== excludeNode) {
        const lastSeenAgo = nowTime - value.timestamp;
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
        metrics: value.metrics,
        timestamp: value.timestamp
      });
    });
    
    // Return sorted result by wallet
    return result.sort((el1, el2) => {
      return el1.wallet.toString().localeCompare(el2.wallet.toString());
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
