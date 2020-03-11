const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const rootDir = path.dirname(process.mainModule.filename);

// Save object to file
const saveJSONToFile = async (json, fileName) => {
    const filePath = path.join(process.cwd(), fileName);
    const text = JSON.stringify(json, null, 2);
    await fs.writeFile(filePath, text);
};

// Save object to a specific path
const saveJSONToPath = async (json, path) => {
  const text = JSON.stringify(json, null, 2);
  await fs.writeFile(path, text);
};

// Load JSON file to object
const loadJSONFile = async (fileName) => {
    const filePath = path.join(process.cwd(), fileName);
    const fileJSON = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(fileJSON);
    return json;
};

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

// Delete temp directory if already exists if not create one
const prepareTempDirectory = tempDir => {  
    // Create temp directory
    if (fs.existsSync(tempDir)) {
      rmNonEmptyDir(tempDir);
      fs.mkdirSync(tempDir);
    } else {
      fs.mkdirSync(tempDir);
    }
};

// Create a zip Archive
const createArchive = async (folderPath, resultFilePath, password) => {
  if (password !== undefined && password !== ''){
    await execAsync(`zip -P "${password}" -r -j ${resultFilePath} ${folderPath}`);
  } else {
    await execAsync(`zip -r -j ${resultFilePath} ${folderPath}`);
  }
  // Removing zipped directory
  rmNonEmptyDir(folderPath);
};

// Exec a command asynchronously 
const execAsync = cmd => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(Error(stdout + stderr));
      }
      resolve(stdout + stderr);
    });
});

// Check if file exists
const fileExists = async fileName => new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), fileName);
    fs.access(filePath, (error) => {
        if (error) {
            resolve(false);
        } else {
            resolve(true);
        }
    });
});

module.exports = {
    rootDir,
    saveJSONToFile,
    loadJSONFile,
    execAsync,
    fileExists,
    prepareTempDirectory,
    saveJSONToPath,
    createArchive
};