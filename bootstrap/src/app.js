const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const mainRoutes = require('./routes/main');
const servicesRoutes = require('./routes/services');
const joinRoutes = require('./routes/join');
const generateRoutes = require('./routes/generate');
const { get404 } = require('./error');
const { rootDir } = require('./utils');

// Main function
function main () {
  const app = express();

  // Add body parser to express
  app.use(bodyParser.urlencoded({ extended: false }));

  // Add static files support
  app.use(express.static(path.join(rootDir, 'public')));

  // Add routes
  app.use('/', mainRoutes.routes);

  app.use('/services', servicesRoutes.routes);

  app.use('/generate', generateRoutes.routes);

  app.use('/join', joinRoutes.routes);

  // Add not found middleware
  app.use(get404);

  app.listen(3000);
}

main();
