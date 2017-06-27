'use strict'
var db = require('./db');
var config = require('../config.json');
var login = require('./login');

function getProviders(req, res, next) {
    db.any("select id, name, logintype, categories, description from provider where deletedate is null")
    .then(function(data){
        res.status(200).json({
            providers: data
        })
    })
    .catch(next);
}

function getNews(req, res, next) {
    if (typeof req.params.id === "undefined") {
        next(config.errors.newsNoArticleProvided);
        return false;
    }
    var token = req.query.token;
    db.one("select id, url, category, title, mainpicture, summary, paragraphs, permissions, published at time zone 'UTC' as published from article where id = $1", req.params.id)
    .then(function(data){
        if (!data.permissions){
            res.status(200).json({data:data});
            return true;
        }
        if (typeof token === "undefined") {
            data.paragraphs = null;
            res.status(200).json({
                code: 2,
                data: data
            });
            return false;
        }
        return login.validate(token)
                .then(function(tokenContent){
                    if (tokenContent.content.permissions && _containsAllPermissions(data.permissions, tokenContent.content.permissions))
                        res.status(200).json({
                            data: data,
                            token: tokenContent.token
                        });
                    else {
                        data.paragraphs = null;
                        res.status(200).json({
                            code: 2,
                            data: data,
                            token: tokenContent.token
                        });
                    }
                })
    })
    .catch(next)
}

function _containsAllPermissions(articlePermissions, userPermissions) {
    var artPer = articlePermissions.split(",");
    var usrPer = userPermissions.split(",");
    var allCorrect = true;
    for (var i = 0, j = artPer.length; i < j; i++) {
        var contains = false;
        for (var k = 0, l = usrPer.length; k < l; k++) {
            if (usrPer[k] === artPer[i]) {
                contains = true;
                break;
            }
        };
        if (!contains) {
            allCorrect = false;
            break;
        }
    };
    return allCorrect;
}

function getNewslist(req, res, next) {
    if (typeof req.query.provider === "undefined") {
        next(config.errors.newslistNoProvider);
        return false;
    }
    var query = "select published at time zone 'UTC' as published, id, title, mainpicture, category, provider, permissions from article where provider = $1 ";
    if (req.query.id && req.query.date)
        query += "and (published, id) < ($2, $3) ";
    if (req.query.category)
        query += "and category = $5 ";
    query += "order by published desc, id desc limit $4";

    db.any(query, [req.query.provider, req.query.date, req.query.id, config.articleLimit, req.query.category])
    .then(function(data){
        res.status(200).json(data);
    })
    .catch(next);
}

function getBookmarks(req, res, next) {
    if (typeof req.query.token === "undefined"){
        next(config.errors.bookmarkParametersMissingOnGet);
        return false;
    }
    var token = req.query.token;
    var tokenContent;
    login.validate(token, true)
    .then(function(data){
        tokenContent = data.content;
        token = data.token;
        return db.any("select user_article.id as id, article.url, article.id as article, article.title from article INNER join user_article on article.id = user_article.article and user_article.deletedate is null and article.deletedate is null and user_article.provider_user=$1", tokenContent.user)
            .then(function(bookmarks){
                res.status(200).json({
                    provider: tokenContent.provider,
                    data: bookmarks
                });
            })
            .catch(function(){
                res.status(412).send("article not found");
            })

    })
    .catch(next);
}

function postALotBookmarks(req, res, next) {
    if (typeof req.body.token === "undefined"){
        next(config.errors.bookmarkParametersMissing);
        return false;
    }
    var token = req.body.token;
    var tokenContent;
    login.validate(token, true)
    .then(function(data){
        tokenContent = data.content;
        token = data.token;
        var article = JSON.parse(req.body.id);
        var whereString = article.map((x,i) => "id=$" + (i + 1) + " or ").join("").slice(0,-3);
        return db.many("select provider from article where "+whereString, article)
            .then(function(articleInfo){
                var denyed = articleInfo.find(x => x.provider !== tokenContent.provider)
                if (denyed)
                    throw false;
                var insertString = article.map((x,i) => "($1, $" + (i + 2) + "), ").join("").slice(0,-2);
                article.unshift(tokenContent.user);
                return db.many("insert into user_article (provider_user, article) values " + insertString +
                    " ON CONFLICT (article, provider_user) " +
                    "DO UPDATE SET deletedate = NULL returning id", article)
                    .then(function(data){
                        res.status(200).send();
                    })
            })
            .catch(function(e){
                res.status(412).send("article not found");
            })
    })
    .catch(next);
}

function postBookmark(req, res, next) {
    if (typeof req.body.token === "undefined"){
        next(config.errors.bookmarkParametersMissing);
        return false;
    }
    var token = req.body.token;
    var article = req.body.id;
    var tokenContent;
    login.validate(token, true)
    .then(function(data){
        tokenContent = data.content;
        token = data.token;
        return db.one("select provider from article where id=$1", article)
            .then(function(articleInfo){
                if (tokenContent.provider !== articleInfo.provider)
                    throw false;
                return db.one("insert into user_article (article, provider_user) values ($1, $2) "+
                    "ON CONFLICT (article, provider_user) " +
                    "DO UPDATE SET deletedate = NULL returning id", [article, tokenContent.user])
                    .then(function(data){
                        res.status(200).json({
                            id: data.id
                        });
                    })
            })
            .catch(function(e){
                res.status(412).send("article not found");
            })

    })
    .catch(next);
}

function deleteBookmark(req, res, next) {
    if (typeof req.body.token === "undefined"){
        next(config.errors.bookmarkParametersMissingOnDelete);
        return false;
    }
   
    var token = req.body.token;
    var bookmarkId = req.params.id;
    var tokenContent;
    login.validate(token, true)
    .then(function(data){
        tokenContent = data.content;
        token = data.token;
        return db.one("update user_article set deletedate = current_timestamp where id=$1 and provider_user=$2 returning id", [bookmarkId, tokenContent.user])
            .then(function(){
                res.status(200).send(200);
            })
            .catch(function(){
                res.status(412).send("article not found");
            })

    })
    .catch(next);
}

module.exports = {
    providers: getProviders,
    newslist: getNewslist,
    news: getNews,
    postBookmark: postBookmark,
    postBookmarkMany: postALotBookmarks,
    getBookmarks: getBookmarks,
    deleteBookmark: deleteBookmark
};
