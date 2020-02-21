const path = require('path');
const fs = require('fs');
const {
  rootDir
} = require('./utils');

// Service file path
const serviceFile = path.join(rootDir, '..', 'services.json');

module.exports = class Service {
  static getServices () {
    const fileContent = fs.readFileSync(serviceFile);
    return JSON.parse(fileContent);
  }
};
