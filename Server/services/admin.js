'use strict'
var promise = require('bluebird');
var config = require('../config.json');
var db = require('./db');
var rp = require('request-promise');
var xml = require('xml2js').parseString;
var striptags = require('striptags');
var bcrypt = require('bcrypt');

function addNews(req, res, next) {
    var provider;
    db.one('select id, clientsecret, name from provider where clientid=$1 and deletedate is null', req.body.clientid)
    .then(function(data){
        provider = data;
        return bcrypt.compare(req.body.clientsecret, data.clientsecret)
            .then(function(correctPW){
                if (!correctPW)
                    throw(config.errors.adminlogin)
            })
    })
    .then(function(){
        var data = JSON.parse(req.body.data);
        return _uploadData(data, provider.id)
            .catch(function(e){
                var error = config.errors.articleBatchUpload;
                error.trace = e;
                throw (error);
            });
    })
    .then(function(){
        res.status(200).json({
            status:200,
            data: "Batch of news has been saved for " + provider.name
        });
    })
    .catch(next);
}

function cron(req, res, next) {
    var providers = [];
    db.any('select id, articlescript, name from provider where deletedate is null and articlescript is not null')
    .then(function(data){
        var requests = [];
        providers = data;
        for (var i = 0, j = providers.length; i < j; i++) {
            var provider = providers[i];
            requests.push(
                _getNews(provider.articlescript, provider.id)
                .then(function(data){
                    return _uploadData(data.data, data.provider);
                })
                .catch(function(e){
                    throw (e);
                })
            );
        };
        return promise.all(requests);
    })
    .then(function(){
        var names = "";
        for (var i = 0, j = providers.length; i < j; i++) {
            names += providers[i].name + ", ";
        };
        res.status(200).json({
            status:200,
            data: "New batch of news has just been saved for " + names
        });
    })
    .catch(next);
}

function _uploadData(data, id) {
    return db.tx(t => {
        var queries = [];
        var parsedArticle;
        for (var i = 0, j = data.length; i < j; i++) {
            parsedArticle = _parseArticle(data[i]);
            parsedArticle.provider = id;
            queries.push(
                t.none( "INSERT INTO article (provider, clientid, url, category, published, title, mainpicture, summary, paragraphs, permissions) " +
                "VALUES (${provider},${id},${url},${category},${published},${title},${mainpicture},${summary},${paragraphs},$(permissions)) " +
                "ON CONFLICT (provider, clientid) " +
                "DO UPDATE SET clientid = EXCLUDED.clientid, url = EXCLUDED.url, category = EXCLUDED.category, published = EXCLUDED.published, title = EXCLUDED.title, mainpicture = EXCLUDED.mainpicture, summary = EXCLUDED.summary, paragraphs = EXCLUDED.paragraphs, permissions = EXCLUDED.permissions", parsedArticle)
            )
        };
        return t.batch(queries);
    })
}

function _getNews(scriptString, provider) {
    return new Promise(function(res, rej) {
        try {
            var result = new Function("promise, rp, xml", "'user strict'; " + scriptString);
            res(result(promise, rp, xml));
        } catch(e) {
            rej(config.errors.articleCron);
        }
    })
    .then(function(data){
        return {data: data, provider: provider};
    });
}

function _parseArticle(article) {
    var parsedArticle = {};
    parsedArticle.summary = _stripHTML(article.summary);
    parsedArticle.title = _stripHTML(article.title);
    parsedArticle.mainpicture = article.mainpicture || null;
    parsedArticle.id = article.id || 0;
    parsedArticle.url = article.url || null;
    parsedArticle.category = article.category.toLowerCase() || null;
    parsedArticle.published = article.published || new Date().toISOString();
    if (typeof article.paragraphs !== "undefined" && article.paragraphs.length > 0) {
        parsedArticle.paragraphs = [];
        for (var i = 0, j = article.paragraphs.length; i < j; i++) {
            var paragraph = article.paragraphs[i];
            var content = _stripHTML(paragraph.content);
            if (content)
                parsedArticle.paragraphs.push({
                    order: paragraph.order || 0,
                    type: paragraph.type || "text",
                    content: content
                });
        };
        parsedArticle.paragraphs = JSON.stringify(parsedArticle.paragraphs);
    } else {
        parsedArticle.paragraphs = null;
    }
    parsedArticle.permissions = article.permissions || null;
    if (parsedArticle.permissions !== null) {
        var permissions = parsedArticle.permissions
            .match(/[^ ,]+/g)
            .filter(function(item, pos, self) {
                return self.indexOf(item) == pos;
            })
            .join(',');
        parsedArticle.permissions = permissions;
    }
    return parsedArticle;
}

function _stripHTML(data) {
    if (typeof data === 'undefined')
        return null;
    var parsed = striptags(data, ['a','b','i','strong','h1','h2','h3','h4','h5', 'h6', 'ul','ol','li', 'p']);
    parsed = parsed.replace(/(?:\r\n|\r|\n)/g, '');
    return (parsed === '') ? null : parsed;
}

function createTestProviderEA(req, res, next) {

    db.none('select id from provider where name=$1',["Äripäev"])
    .then(function(){
        return bcrypt.hash("aripaev", config.saltRounds);
    })
    .then(function (hash) {
        var provider = {
                name: "Äripaev",
                description: "Sinu igapäevsed äriuudised",
                clientid: 'aripaev',
                clientsecret: hash,
                categories: "börsiuudised,uudised,arvamused,juhtkiri,investor toomas,kliendiblogi,meelelahutus,raamat,veebiraamat,sisuturundus,äripäev eetris,vabalt",
                time: 30,
                scam: 'function _queryForArticles(){var e={method:"GET",uri:"http://bge-eadev.newscyclecloud.com/apps/ows.dll/sites/ea/stories",headers:{Authorization:"Bearer XXXXXXXXXXX"}};return rp(e).then(function(r){var n=[];return xml(r,function(e,r){for(var o=r["onl:stories"]["onl:story"],t=0,i=o.length;i>t;t++)n.push(o[t].$.uri)}),_multipleQueries(n,e)})}function _multipleQueries(e,r){for(var n=[],o=0,t=e.length;t>o;o++){r.uri=e[o];var i=rp(r).then(function(e){var r={};return xml(e,function(e,n){var o=n["onl:story"],t=o.$,i=o["onl:metadata"][0],a=o["onl:content"][0];if(r={id:t.key,url:t.viewuri,category:i["onl:category"][0]._,published:i["onl:published"][0].$.timestamp,title:a["onl:heading"][0],permissions:"",paragraphs:[]},i["onl:accesscontrol"]&&(i["onl:accesscontrol"][0]["onl:currentflowitemident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:currentflowitemident"][0]+","),i["onl:accesscontrol"][0]["onl:singlesaleident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:singlesaleident"][0]+",")),i["onl:accesscontrols"])for(var l=i["onl:accesscontrols"][0]["onl:accesscontrolitem"],s=0,c=l.length;c>s;s++)r.permissions+=l[s]["onl:identifier"]+",";if(a["onl:image"]&&a["onl:image"][0].$.viewuri&&(r.mainpicture="http://aripaev.ee"+a["onl:image"][0].$.viewuri),a["onl:summary"]&&(r.summary=a["onl:summary"][0]),a["onl:paragraphs"][0])for(var p=a["onl:paragraphs"][0]["onl:paragraph"],u=0,s=0,c=p.length;c>s;s++){var m=p[s];if(m["onl:body"]){var a=m["onl:body"][0];r.paragraphs.push({type:"text",content:a,order:u}),u++}if(m["onl:image"]&&m["onl:image"][0].$.viewuri){var h=m["onl:image"][0].$.viewuri;r.paragraphs.push({type:"img",content:"http://aripaev.ee"+h,order:u}),u++}}}),r});n.push(i)}return promise.all(n).then(function(e){return e})} return _queryForArticles();'
            }
        return db.one('insert into provider (name, reauthtime, articlescript, clientid, clientsecret, categories, description)' +
          'values(${name}, ${time}, $(scam), $(clientid), $(clientsecret), $(categories), $(description)) RETURNING id',
        provider)
        .then(function(d){
            provider.id = d.id;
            return db.one("INSERT INTO oauth (id, clientid, clientsecret, authorizeendpoint, tokenendpoint, logoutendpoint, profileendpoint, profileemailkey, profileidkey, profilenamekey, permissionsendpoint, permissionskey, permissionkey, scope)" +
                "VALUES (${id},'demo_client_application', 'password12345', 'https://ssotestlogin.aripaev.ee/OAuth/Authorize', 'https://ssotestlogin.aripaev.ee/OAuth/Token' ,'https://ssotestlogin.aripaev.ee/account/logout' ,'https://ssotestapi.aripaev.ee/UserDataService/json/Profile','Email','Id','Name' ,'https://ssotestapi.aripaev.ee/UserDataService/json/Permissions','Permissions','Name', '/UserDataService/json/Profile /UserDataService/json/Permissions /UserDataService/json/Orders')"+
                "RETURNING id", provider)
        })
        .then(function(d){
            provider.oauth = d.id;
            return db.one("UPDATE provider "+
                "SET logintype = 'oAuth'"+
                "WHERE id = ${id}"+
                "returning *", provider)
        })
        .then(function(d){
          res.status(200)
            .json({
              status: 'success',
              data: d
            });
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

function createTestProviderPM(req, res, next) {

    db.none('select id from provider where name=$1',["Põllumajandus"])
    .then(function(){
        return bcrypt.hash("aripaev", config.saltRounds);
    })
    .then(function (hash) {
        var provider = {
                name: "Põllumajandus",
                description: 'Kõik põllumajandusega seotud ühes teemaveebis',
                clientid: 'pollumajandus',
                clientsecret: hash,
                categories: "sisuturundus,uudised",
                scam: 'function _queryForArticles(){var e={method:"GET",uri:"http://bge-pmdev.newscyclecloud.com/apps/ows.dll/sites/pm/stories",headers:{Authorization:"Bearer XXXXXXXX"}};return rp(e).then(function(r){var n=[];return xml(r,function(e,r){for(var o=r["onl:stories"]["onl:story"],t=0,i=o.length;i>t;t++)n.push(o[t].$.uri)}),_multipleQueries(n,e)})}function _multipleQueries(e,r){for(var n=[],o=0,t=e.length;t>o;o++){r.uri=e[o];var i=rp(r).then(function(e){var r={};return xml(e,function(e,n){var o=n["onl:story"],t=o.$,i=o["onl:metadata"][0],a=o["onl:content"][0];if(r={id:t.key,url:t.viewuri,category:i["onl:category"][0]._,published:i["onl:published"][0].$.timestamp,title:a["onl:heading"][0],permissions:"",paragraphs:[]},i["onl:accesscontrol"]&&(i["onl:accesscontrol"][0]["onl:currentflowitemident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:currentflowitemident"][0]+","),i["onl:accesscontrol"][0]["onl:singlesaleident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:singlesaleident"][0]+",")),i["onl:accesscontrols"])for(var l=i["onl:accesscontrols"][0]["onl:accesscontrolitem"],s=0,c=l.length;c>s;s++)r.permissions+=l[s]["onl:identifier"]+",";if(a["onl:image"]&&a["onl:image"][0].$.viewuri&&(r.mainpicture="http://pollumajandus.ee"+a["onl:image"][0].$.viewuri),a["onl:summary"]&&(r.summary=a["onl:summary"][0]),a["onl:paragraphs"][0])for(var p=a["onl:paragraphs"][0]["onl:paragraph"],u=0,s=0,c=p.length;c>s;s++){var m=p[s];if(m["onl:body"]){var a=m["onl:body"][0];r.paragraphs.push({type:"text",content:a,order:u}),u++}if(m["onl:image"]&&m["onl:image"][0].$.viewuri){var h=m["onl:image"][0].$.viewuri;r.paragraphs.push({type:"img",content:"http://pollumajandus.ee"+h,order:u}),u++}}}),r});n.push(i)}return promise.all(n).then(function(e){return e})} return _queryForArticles();'
            }
        return db.one('insert into provider (name, articlescript, clientid, clientsecret, categories, description)' +
          'values(${name}, $(scam), $(clientid), $(clientsecret), $(categories), $(description)) RETURNING id',
        provider)
        .then(function(d){
          res.status(200)
            .json({
              status: 'success',
              data: d
            });
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

function createTestProviderRM(req, res, next) {

    db.none('select id from provider where name=$1',["Raamatupidaja"])
    .then(function(){
        return bcrypt.hash("aripaev", config.saltRounds);
    })
    .then(function (hash) {
        var provider = {
                name: "Raamatupidaja",
                description: 'Raamatupidaja on infoallikas kõigile maksumaksjatele ja maksudega tegelejatele. Vahendame värskemaid uudiseid ja teavitame olulistel teemadel.',
                clientid: 'raamatupidaja',
                clientsecret: hash,
                categories: "uudised,arvamused,sisuturundus",
                time: 30,
                scam: 'function _queryForArticles(){var e={method:"GET",uri:"http://bge-rmdev.newscyclecloud.com/apps/ows.dll/sites/rm/stories",headers:{Authorization:"Bearer XXXXXXXXX"}};return rp(e).then(function(r){var n=[];return xml(r,function(e,r){for(var o=r["onl:stories"]["onl:story"],t=0,i=o.length;i>t;t++)n.push(o[t].$.uri)}),_multipleQueries(n,e)})}function _multipleQueries(e,r){for(var n=[],o=0,t=e.length;t>o;o++){r.uri=e[o];var i=rp(r).then(function(e){var r={};return xml(e,function(e,n){var o=n["onl:story"],t=o.$,i=o["onl:metadata"][0],a=o["onl:content"][0];if(r={id:t.key,url:t.viewuri,category:i["onl:category"][0]._,published:i["onl:published"][0].$.timestamp,title:a["onl:heading"][0],permissions:"",paragraphs:[]},i["onl:accesscontrol"]&&(i["onl:accesscontrol"][0]["onl:currentflowitemident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:currentflowitemident"][0]+","),i["onl:accesscontrol"][0]["onl:singlesaleident"]&&(r.permissions+=i["onl:accesscontrol"][0]["onl:singlesaleident"][0]+",")),i["onl:accesscontrols"])for(var l=i["onl:accesscontrols"][0]["onl:accesscontrolitem"],s=0,c=l.length;c>s;s++)r.permissions+=l[s]["onl:identifier"]+",";if(a["onl:image"]&&a["onl:image"][0].$.viewuri&&(r.mainpicture="http://raamatupidaja.ee"+a["onl:image"][0].$.viewuri),a["onl:summary"]&&(r.summary=a["onl:summary"][0]),a["onl:paragraphs"][0])for(var p=a["onl:paragraphs"][0]["onl:paragraph"],u=0,s=0,c=p.length;c>s;s++){var m=p[s];if(m["onl:body"]){var a=m["onl:body"][0];r.paragraphs.push({type:"text",content:a,order:u}),u++}if(m["onl:image"]&&m["onl:image"][0].$.viewuri){var h=m["onl:image"][0].$.viewuri;r.paragraphs.push({type:"img",content:"http://raamatupidaja.ee"+h,order:u}),u++}}}),r});n.push(i)}return promise.all(n).then(function(e){return e})} return _queryForArticles();'
            }
        return db.one('insert into provider (name, reauthtime, articlescript, clientid, clientsecret, categories, description)' +
          'values(${name}, ${time}, $(scam), $(clientid), $(clientsecret), $(categories), $(description)) RETURNING id',
        provider)
        .then(function(d){
            provider.id = d.id;
            return db.one("INSERT INTO oauth (id, clientid, clientsecret, authorizeendpoint, tokenendpoint, logoutendpoint, profileendpoint, profileemailkey, profileidkey, profilenamekey, permissionsendpoint, permissionskey, permissionkey, scope)" +
                "VALUES (${id},'demo_client_application', 'password12345', 'https://ssotestlogin.aripaev.ee/OAuth/Authorize', 'https://ssotestlogin.aripaev.ee/OAuth/Token' ,'https://ssotestlogin.aripaev.ee/account/logout' ,'https://ssotestapi.aripaev.ee/UserDataService/json/Profile','Email','Id','Name' ,'https://ssotestapi.aripaev.ee/UserDataService/json/Permissions','Permissions','Name', '/UserDataService/json/Profile /UserDataService/json/Permissions /UserDataService/json/Orders')"+
                "RETURNING id", provider)
        })
        .then(function(d){
            provider.oauth = d.id;
            return db.one("UPDATE provider "+
                "SET logintype = 'oAuth'"+
                "WHERE id = ${id}"+
                "returning *", provider)
        })
        .then(function(d){
          res.status(200)
            .json({
              status: 'success',
              data: d
            });
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

module.exports = {
    cron: cron,
    create: createTestProviderEA,
    createPM: createTestProviderPM,
    createRM: createTestProviderRM,
    addNews: addNews
};

// the test cron job
var scriptString = `function _queryForArticles(){
    var options = {
        method: 'GET',
        uri: 'http://www.aripaev.ee/apps/ows.dll/sites/ea/stories',
        headers: {
            'Authorization': 'Bearer XXXXXXXXX'
        }
    };
    return rp(options)
            .then(function(data) {
                var parsedData = [];
                xml(data, function (err, result) {
                    var stories = result['onl:stories']['onl:story'];
                    for (var i = 0, j = stories.length; i < j; i++) {
                        parsedData.push(stories[i]['$']['uri']);
                    };
                });
                // if each article is in individual query
                return _multipleQueries(parsedData, options)
            })
}

function _multipleQueries(list, query) {
    var requests = [];
    for (var i = 0, j = list.length; i < j; i++) {
        query.uri = list[i];
        var request = rp(query).then(function(data){
            var parsedStory = {};
            xml(data, function (err, result) {
                var story = result['onl:story'];
                var storyParams = story['$'];
                var meta = story['onl:metadata'][0];
                var content = story['onl:content'][0];

                parsedStory = {
                    id: storyParams['key'],
                    url: storyParams['viewuri'],
                    category: meta['onl:category'][0]['_'],
                    published: meta['onl:published'][0]['$']['timestamp'],
                    title: content['onl:heading'][0],
                    permissions: "",
                    paragraphs: []
                };
            
                if (meta["onl:accesscontrol"]) {
                    if (meta["onl:accesscontrol"][0]["onl:currentflowitemident"])
                        parsedStory.permissions += meta["onl:accesscontrol"][0]["onl:currentflowitemident"][0] + ",";
                    if (meta["onl:accesscontrol"][0]["onl:singlesaleident"])
                        parsedStory.permissions += meta["onl:accesscontrol"][0]["onl:singlesaleident"][0] + ",";
                }
                if (meta["onl:accesscontrols"]) {
                    var items = meta["onl:accesscontrols"][0]['onl:accesscontrolitem'];
                    for (var i = 0, j = items.length; i < j; i++) {
                        parsedStory.permissions += items[i]["onl:identifier"] + ",";
                    };
                }
                if (content['onl:image'] && content['onl:image'][0]['$']['viewuri']) {
                    parsedStory.mainpicture = 'http://aripaev.ee' + content['onl:image'][0]['$']['viewuri'];
                }

                if (content['onl:summary']) {
                    parsedStory.summary = content['onl:summary'][0];
                }
                
                if (content['onl:paragraphs'][0]){
                    var paragraphs = content['onl:paragraphs'][0]['onl:paragraph'];
                    var order = 0;                  
                    for (var i = 0, j = paragraphs.length; i < j; i++) {
                        var paragraph = paragraphs[i];
                        if (paragraph['onl:body']) {
                            var content = paragraph['onl:body'][0];
                            parsedStory.paragraphs.push({
                                type: 'text',
                                content: content,
                                order: order
                            })
                            order++;
                        }
                        if (paragraph['onl:image'] && paragraph['onl:image'][0]['$']['viewuri']){
                            var img = paragraph['onl:image'][0]['$']['viewuri'];
                            parsedStory.paragraphs.push({
                                type: 'img',
                                content: 'http://aripaev.ee' + img,
                                order: order
                            })
                            order++;
                        }
                    };
                }
            });
            return parsedStory;
        })
        requests.push(request);
    };
    return promise.all(requests).then(function(data){
        return data;
    });
}
return _queryForArticles();`;