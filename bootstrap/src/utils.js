const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const { exec } = require('child_process');

const rootDir = path.dirname(process.mainModule.filename);

const readFileAsync = promisify(fs.readFile);

const existsAsync = promisify(fs.exists);

const unlinkAsync = promisify(fs.unlink);

const writeFileAsync = promisify(fs.writeFile);

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
};

const execAsync = cmd => new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      reject(Error(stdout + stderr));
    }
    resolve(stdout + stderr);
  });
});

module.exports = {
  rootDir,
  readFileAsync,
  asyncMiddleware,
  existsAsync,
  unlinkAsync,
  writeFileAsync,
  execAsync
};
