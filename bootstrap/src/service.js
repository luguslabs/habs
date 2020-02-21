const path = require('path');

const { 
    readFileAsync,
    rootDir
} = require('./utils');

// Service file path
const serviceFile = path.join(rootDir, "..", "services.json"); 

module.exports = class Service {
    static async getServices() {
        const fileContent = await readFileAsync(serviceFile);
        return JSON.parse(fileContent);
    }
}
