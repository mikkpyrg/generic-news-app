'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var log = require('pino')();
var swag = require('swagger-jsdoc');

var api = require('./routes/api');

var app = express();

// options for the swagger docs
var swagoptions = {
  // import swaggerDefinitions
    swaggerDefinition: {
        info: {
            title: 'News server API',
            version: '1.0.0',
            description: 'Demonstrating how to use the server api',
        }
    },
  // path to the API docs
  apis: ['./routes/api.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swag(swagoptions);

// serve swagger
app.get('/api/v1/swagger.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api/v1/swagger', express.static('./api-docs'))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.status(200);
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/v1', api);

app.use(function(err, req, res, next) {
    err.error = err.error || {};
    var status = err.error.status || 400;
    var message = err.error.title || "Bad Request";
    log.error(err);
    res.status(status)
    .json({
        error: {
            status: status,
            message: message
        }
    });
});

module.exports = app;
