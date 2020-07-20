const express = require('express');
const bodyParser = require('body-parser');
const smsRoutes = require('./routes/sms');

// Return not found response
const get404 = (req, res, next) => {
  const error = {
    errors: [
      {
        status: '404',
        title: 'Not found',
        detail: 'Requested resource was not found.'
      }
    ]
  };
  res.status(404).json(error);
};

// Simple error handler
const errorHandler = (err, req, res, next) => {
  const error = {
    errors: [
      {
        status: '500',
        title: 'Error',
        detail: err.toString()
      }
    ]
  };
  res.status(500).json(error);
};

// Init api
const initApiSms = async orchestrator => {
  const app = express();

  app.set('orchestrator', orchestrator);

  // Add body parser to express
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Use routes
  app.use('/sms', smsRoutes.routes);

  // Add not found middleware
  app.use(get404);

  // Add error handler
  app.use(errorHandler);

  // Set listen port
  app.listen(3001);
};

module.exports = {
  initApiSms
};
