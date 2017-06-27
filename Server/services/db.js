'use strict'
var promise = require('bluebird');
var config = require('../config.json');
// psql -f puppies.sql --username=postgres
var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var db = pgp(config.database);

module.exports = db;