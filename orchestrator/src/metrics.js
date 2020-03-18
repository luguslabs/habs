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

  // Show all metrics from Map
  showMetrics () {
    debug('showMetrics', '--------- Stored metrics ---------');
    this.metrics.forEach((value, key) => {
      debug('showMetrics', `${key} - [${value.metrics}] (${new Date(parseInt(value.timestamp)).toString()}`);
    });
    debug('showMetrics', '----------------------------------');
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

  getAllMetrics () {
    const result = new Array();
    this.metrics.forEach((value, key) => {
      result.push({
        wallet: key,
        metrics: value.metrics,
        timestamp: value.timestamp
      });
    });
    return result;
  }

  // Get metrics of a node
  getMetrics (wallet) {
    return this.metrics.get(wallet);
  }
};

module.exports = {
  Metrics
};
