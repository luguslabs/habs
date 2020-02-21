const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const rootDir = path.dirname(process.mainModule.filename);

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

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

const execCmdSync = cmd => {
  return execSync(cmd).toString();
};

module.exports = {
  rootDir,
  asyncMiddleware,
  execCmdSync,
  rmNonEmptyDir
};
