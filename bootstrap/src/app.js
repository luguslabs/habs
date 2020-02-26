const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const mainRoutes = require('./routes/main');
const servicesRoutes = require('./routes/services');
const generateRoutes = require('./routes/generate');
const {
  get404,
  errorHandler
} = require('./error');
const {
  rootDir
} = require('./utils');

// Main function
function main () {
  const app = express();

  // Enable file upload support
  app.use(fileUpload({
    createParentPath: true
  }));

  // Add body parser to express
  app.use(bodyParser.urlencoded({ extended: false }));

  // Add static files support
  app.use(express.static(path.join(rootDir, 'public')));

  // Add routes
  app.use('/', mainRoutes.routes);

  app.use('/services', servicesRoutes.routes);

  app.use('/generate', generateRoutes.routes);

  // Add not found middleware
  app.use(get404);

  // Add error handler
  app.use(errorHandler);

  app.listen(3000);
}

main();
