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

  getMetrics (wallet) {
    return this.metrics.get(wallet);
  }
};

module.exports = {
  Metrics
};
