const debug = require('debug')('metrics');

// Metrics class to simplify metrics management
class Metrics {
  constructor () {
    this.metrics = new Map();
  }

  addMetrics (wallet, metrics, timestamp) {
    var nodeMetrics = {
      metrics,
      timestamp
    };

    this.metrics.set(wallet, nodeMetrics);
  }

  showMetrics () {
    this.metrics.forEach((value, key) => {
      console.log(`--------- Node: ${key} ---------`);
      console.log(`Metrics: ${value.metrics}`);
      console.log(`Timestamp: ${value.timestamp}`);
      console.log(`Date: ${new Date(parseInt(value.timestamp)).toString()}`);
      console.log('--------------------------------------------------------------------------');
    });
  }

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

  getMetrics (wallet) {
    return this.metrics.get(wallet);
  }
};

module.exports = {
  Metrics
};
