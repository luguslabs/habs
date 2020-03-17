const express = require('express');
const asyncHandler = require('express-async-handler')
const bodyParser = require('body-parser');

// Get orchestrator info
const getOrchestratorInfo = async orchestrator => {
    const ret = {
        status: 'ok',
        mode: orchestrator.mode,
        suspendService: orchestrator.suspendService
    }

    return ret;
}

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

const initApi = async orchestrator => {
    const app = express();

    // Add body parser to express
    app.use(bodyParser.urlencoded({ extended: false }));
    
    // Add main route
    app.get('/', asyncHandler(async (req, res) => {
        const ret = await getOrchestratorInfo(orchestrator);
        res.json(ret);
    }));

    // Add not found middleware
    app.use(get404);
    
    // Add error handler
    app.use(errorHandler);

    // Set listen port
    app.listen(3000);

}

module.exports = {
    initApi
}