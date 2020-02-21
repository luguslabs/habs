const path = require('path');

const { rootDir } = require('./utils');

exports.joinFederation = (req, res, next) => {
  // Send an html page
  res.sendFile(path.join(rootDir, 'views', 'index.html'));
};
