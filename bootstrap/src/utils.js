const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

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

module.exports = {
  rootDir,
  readFileAsync,
  asyncMiddleware,
  existsAsync,
  unlinkAsync,
  writeFileAsync
};
