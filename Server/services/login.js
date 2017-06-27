'use strict'
var promise = require('bluebird');
var config = require('../config.json');
var db = require('./db');
var oAuth = require('./loginOauth');
var jwt = require('jsonwebtoken');

function login(req, res, next) {
    _checkProvider(req.body.provider)
    .then(function(provider){
        return _chooseLoginMethod(provider, req.body);
    })
    .then(function(data){
        res.status(200).json(data)
    })
    .catch(next);
}

function reauth(req, res, next) {
    validateToken(req.body.token)
    .then(function(data){
        res.status(200).json({
            status: 200,
            token: data.token
        });
    })
    .catch(next);
}

function validateToken(token, noReauth) {
    var tokenContent;
    try {
        tokenContent = jwt.verify(token, config.tokenSecret);
    } catch(e) {
        return new Promise(function(res, rej){
            rej(config.errors.invalidToken);
        })
    }
    return db.one('select * from session where id=$1 and token=$2', [tokenContent.session, token])
        .catch(function(){
            throw(config.errors.noTokenInDb);
        })
        .then(function(session){
            var currentDate = new Date();
            var tokenDate = new Date(Date.parse(session.refreshdate));
            var timeDifference = (currentDate - tokenDate)/60000;
            var result = {
                    content: tokenContent,
                    token: token
                };
            if (noReauth || timeDifference < session.reauthtime){
                return result
            }
            else
                return _chooseReauthMethod(tokenContent);
        });
}

function logout(req, res, next) {
    _deleteToken(req.body.token)
    .then(function(data){
        res.status(200).json({
            status: 200,
            message: "User has been logged out"
        });
    })
    .catch(next);
}

function _deleteToken(token) {
    var tokenContent;
    try {
        tokenContent = jwt.verify(token, config.tokenSecret);
    } catch(e) {
        return new Promise(function(res, rej){
            rej(config.errors.invalidToken);
        })
    }
    return db.none('delete from session where id=$1 and token=$2', [tokenContent.session, token])
            .catch(function(){
                throw(config.errors.noTokenInDb);
            })
}

function _checkProvider(params) {
    return db.one('select id, logintype, reauthtime from provider where id=$1 and deletedate is null', params)
        .catch(function(){
            return config.errors.invalidProvider
        })
}

function _chooseLoginMethod(provider, params) {
    // use the correct login service.
    var service;
    switch(provider.loginType) {
        default: 
            service = oAuth.login(provider, params.code);
    }
    return service;
}

function _chooseReauthMethod(params) {
    // use the correct login service.
    var service;
    switch(params.logintype) {
        default: 
            service = oAuth.reauth(params);
    }
    return service;
}

module.exports = {
    login: login,
    reauth: reauth,
    validate: validateToken,
    logout: logout
};
