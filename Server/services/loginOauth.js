'use strict'
var config = require('../config.json');
var rp = require('request-promise');
var db = require('./db');
var jwt = require('jsonwebtoken');

function login(provider, code) {
	var tokens = {};
	var profile = {};
	var permissions = {};
	var providerOauth = {};
	return _getProvider(provider.id)
	.then(function(data){
		providerOauth = data;
		if (typeof code === "undefined")
			return _getAuthorizationUrl(providerOauth);
		return _getToken(providerOauth, code)
		.then(function(data){
			tokens = data;
			return _getProfile(providerOauth, tokens.access);
		})
		.then(function(data){
			profile = data;
			if(providerOauth.permissionsendpoint)
				return _getPermissions(providerOauth, tokens.access)
		})
		.then(function(permissions){
			// put all this into DB
			var data = {
				id: provider.id,
				clientid: profile.id,
				email: profile.email,
				name: profile.name,
				permissions: permissions
			}
			return db.one( "with addeduser as ( "+
				"INSERT INTO provider_user (provider, clientid, email, name, permissions) " +
				"VALUES (${id},${clientid},${email},${name},${permissions}) " +
				"ON CONFLICT (provider, clientid) " +
				"DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, permissions = EXCLUDED.permissions "+
				"returning id), addedsession as( "+
				"INSERT INTO session (provider_user, refreshdate) "+
				"select id, current_timestamp from addeduser "+
				"returning id) "+
				"select addeduser.id as userid, addedsession.id as sessionid from addeduser, addedsession ", data)
				.then(function(ids) {
					console.log(permissions);
					var signedToken = _signToken({
						user: ids.userid,
						refreshtoken: tokens.refresh,
						provider: provider.id,
						logintype: provider.logintype,
						permissions: permissions,
						session: ids.sessionid
					});
					return db.none("UPDATE session set token=$1, reauthtime=$2 where id=$3",[signedToken, provider.reauthtime, ids.sessionid])
						.then(function() {
							return {
								token: signedToken
							};
						})
				})
				.catch(function(e){
					var error = config.errors.oAuthDB;
					error.trace = e;
					throw (error);
				})
		});
	})
}

function _getProvider(providerId) {
	return db.one('select * from oauth where id=$1 and deletedate is null', providerId)
}

function _getAuthorizationUrl(params) {
	var state = Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);

    var url = params.authorizeendpoint +
	"?client_id=" + encodeURIComponent(params.clientid) +
	"&response_type=code" +
	"&redirect_uri=" + encodeURIComponent(config.appcallbackurl) +
	"&scope=" + encodeURIComponent(params.scope) +
	"&state=" + state;

	return {
		state: state,
		url: url
	}
}

function _getToken(params, code) {
	var options = {
		method: 'POST',
		uri: params.tokenendpoint,
		form: {
	        code: code,
	        client_id: params.clientid,
	        client_secret: params.clientsecret,
	        grant_type: "authorization_code",
	        redirect_uri: config.appcallbackurl
	    },
	    header: {
	    	"Content-Type": "application/x-www-form-urlencoded"
	    }
	};
	return rp(options)
		.catch(function(e){
			var error = config.errors.oAuthToken;
			error.trace = e;
			throw (error);
		})
		.then(function(data){
			var data = JSON.parse(data);
			if (data.access_token && data.refresh_token) {
				return {
					access: data.access_token, 
					refresh: data.refresh_token
				};
			}
			throw(data);
		})
		.catch(function(e){
			var error = config.errors.oAuthTokenResult;
			error.trace = e;
			throw (error);
		})
}

function _getProfile(params, accessToken) {
	var options = {
		method: 'GET',
		uri: params.profileendpoint,
	    headers: {
	    	"Authorization": "Bearer " + accessToken
	    }
	};
	return rp(options)
		.catch(function(e){
			var error = config.errors.oAuthProfile;
			error.trace = e;
			throw (error);
		})
		.then(function(data) {
			data = JSON.parse(data);
			var result = {
				email: data[params.profileemailkey],
				name: data[params.profilenamekey],
				id: data[params.profileidkey]
			}
			return result;
		})
		.catch(function(e){
			var error = config.errors.oAuthProfileResult;
			error.trace = e;
			throw (error);
		})
}

function _getPermissions(params, accessToken) {
	var options = {
		method: 'GET',
		uri: params.permissionsendpoint,
	    headers: {
	    	"Authorization": "Bearer " + accessToken
	    }
	};
	return rp(options)
		.catch(function(e){
			var error = config.errors.oAuthPermissions;
			error.trace = e;
			throw (error);
		})
		.then(function(data) {
			console.log(data);
			data = JSON.parse(data);
			var permissionsArray = data[params.permissionskey];
			var permissions = [];
			for (var i = 0, j = permissionsArray.length; i < j; i++) {
				permissions.push(permissionsArray[i][params.permissionkey]);
			};
			permissions = permissions.filter(function(item, pos, self) {
							    return self.indexOf(item) == pos;
							})
							.join(',');
			if (permissions === "")
				permissions = null;
			return permissions;
		})
		.catch(function(e){
			var error = config.errors.oAuthPermissionsResult;
			error.trace = e;
			throw (error);
		})
}

function _signToken(data) {
	return jwt.sign(data, config.tokenSecret, {expiresIn: config.tokenExpire});
}

function reauth(tokenContent) {
	var tokens = {};
	var profile = {};
	var permissions = {};
	var providerOauth = {};
	return _getProvider(tokenContent.provider)
		.then(function(data){
			providerOauth = data;
			return _getRefreshToken(providerOauth, tokenContent.refreshtoken);
		})
		.then(function(data){
			tokens = data;
			return _getProfile(providerOauth, tokens.access);
		})
		.then(function(data){
			profile = data;
			if(providerOauth.permissionsendpoint)
				return _getPermissions(providerOauth, tokens.access)
		})
		.then(function(permissions){
			// put all this into DB
			var newToken = {
				user: tokenContent.user,
				refreshtoken: tokens.refresh,
				provider: tokenContent.provider,
				logintype: tokenContent.logintype,
				permissions: permissions,
				session: tokenContent.session
			}
			var signedToken = _signToken(newToken);
			var data = {
				id: tokenContent.user,
				clientid: profile.id,
				email: profile.email,
				name: profile.name,
				permissions: permissions,
				token: signedToken,
				sessionid: tokenContent.session
			}
			return db.tx(t => {
				return t.batch([
						t.none("UPDATE provider_user set email=${email}, name=${name}, permissions=${permissions}, clientid=${clientid} where id=${id}", data),
						t.none("UPDATE session set token=${token}, refreshdate=current_timestamp where id=${sessionid}", data)
					])
				})
				.then(function() {
					return {
						content: tokenContent, 
						token: signedToken
					}
				})
				.catch(function(e){
					throw (config.errors.oAuthReauthDB);
				})
		})
}

function _getRefreshToken(params, token) {
	var options = {
		method: 'POST',
		uri: params.tokenendpoint,
		form: {
	        refresh_token: token,
	        client_id: params.clientid,
	        client_secret: params.clientsecret,
	        grant_type: "refresh_token"
	    },
	    header: {
	    	"Content-Type": "application/x-www-form-urlencoded"
	    }
	};
	return rp(options)
		.catch(function(e){
			var error = config.errors.oAuthToken;
			error.trace = e;
			throw (error);
		})
		.then(function(data){
			var data = JSON.parse(data);
			if (data.access_token && data.refresh_token) {
				return {
					access: data.access_token, 
					refresh: data.refresh_token
				};
			}
			throw(data);
		})
		.catch(function(e){
			var error = config.errors.oAuthTokenResult;
			error.trace = e;
			throw (error);
		})
}

module.exports = {
	login: login,
	reauth: reauth
};