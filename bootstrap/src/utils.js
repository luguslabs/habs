const path = require('path');
const fs = require('fs');
const {
  execSync
} = require('child_process');

const rootDir = path.dirname(process.mainModule.filename);

// Remove a directory with files in it
const rmNonEmptyDir = function (path) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path);
    if (files.length > 0) {
      files.forEach(function (filename) {
        if (fs.statSync(path + '/' + filename).isDirectory()) {
          rmNonEmptyDir(path + '/' + filename);
        } else {
          fs.unlinkSync(path + '/' + filename);
        }
      });
      fs.rmdirSync(path);
    } else {
      fs.rmdirSync(path);
    }
  } else {
    throw new Error('Directory was not found.');
  }
};

// Exec a command synchronously and get result as a string
const execCmdSync = cmd => {
  return execSync(cmd).toString();
};

// Create a zip Archive
const createArchive = (folderPath, resultFilePath) => {
  execCmdSync(`zip -r -j ${resultFilePath} ${folderPath}`);
};

// Check if config file exists and create a temp dir if necessary
const checkConfigFile = (configFilePath, tempDir) => {
  // Check if config file already exists
  //if (fs.existsSync(configFilePath)) {
  //  throw new Error('Config file already exists');
  //}

  // Create temp directory
  if (fs.existsSync(tempDir)) {
    rmNonEmptyDir(tempDir);
    fs.mkdirSync(tempDir);
  } else {
    fs.mkdirSync(tempDir);
  }
};

// Write json content into config file and create an archive
const writeConfigToFile = (config, configFilePath, tempDir) => {
  // Writing JSON to file
  fs.writeFileSync('/tmp/archipel-bootstrap/config.json', JSON.stringify(config), 'utf8');

  // Creating Archive with config data
  createArchive('/tmp/archipel-bootstrap', configFilePath);

  // Removing temporary directory
  rmNonEmptyDir(tempDir);
};

module.exports = {
  rootDir,
  execCmdSync,
  rmNonEmptyDir,
  createArchive,
  checkConfigFile,
  writeConfigToFile
};
