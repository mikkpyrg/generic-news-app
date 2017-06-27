'use strict'
var express = require('express');
var router = express.Router();

var login = require('../services/login');
var admin = require('../services/admin');
var general = require('../services/general');

/**
 * @swagger
 * /api/v1/bookmark:
 *   get:
 *     description: Get user's bookmarks
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: user's token
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Bookmarks
 */

router.get('/bookmark', general.getBookmarks);

/**
 * @swagger
 * /api/v1/bookmark/:
 *   post:
 *     description: Add a bookmark to article
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the article's id
 *         in: formData
 *         required: true
 *         type: integer
 *       - name: token
 *         description: user's token
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Bookmark has been added
 */

router.post('/bookmark', general.postBookmark);

/**
 * @swagger
 * /api/v1/bookmark/:
 *   post:
 *     description: Add bookmarks
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Array of article ids
 *         in: formData
 *         required: true
 *         type: integer
 *       - name: token
 *         description: user's token
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Bookmark has been added
 */

router.post('/bookmark/batch', general.postBookmarkMany);

/**
 * @swagger
 * /api/v1/bookmark/{id}:
 *   delete:
 *     description: Delete bookmark
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the bookmark's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: token
 *         description: user's token
 *         in: formData
 *         required: true
 *         type: string
 *     itemId:
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Bookmark has been deleted
 */

router.delete('/bookmark/:id', general.deleteBookmark);

/**
 * @swagger
 * /api/v1/news:
 *   get:
 *     description: Get 10 or so news, has "click for more" paging
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: provider
 *         description: the provider's id
 *         in: query
 *         required: true
 *         type: integer
 *       - name: date
 *         description: last article's date
 *         in: query
 *         type: string
 *       - name: id
 *         description: last article's id
 *         in: query
 *         type: string
 *       - name: category
 *         description: the category of an article
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Get newsitems
 */

router.get('/news', general.newslist);

/**
 * @swagger
 * /api/v1/news/{id}:
 *   get:
 *     description: Get the article's content. Include token to look at content behind paywall
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the article's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: token
 *         description: user's token
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Get the asked newsitem
 */

router.get('/news/:id', general.news);

/**
 * @swagger
 * /api/v1/config:
 *   get:
 *     description: Get current providers
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: providers
 */

router.get('/config', general.providers);

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     description: Log in using oAuth.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: provider
 *         description: the provider's id
 *         in: formData
 *         required: true
 *         type: integer
 *       - name: code
 *         description: the oauth code that you get from logging into the service.
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: token, for future actions. If no code was provided then the url needed to perform the redirect login.
 */

router.post('/login', login.login);

/**
 * @swagger
 * /api/v1/reauth:
 *   post:
 *     description: Reauthenticate token.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: user's token
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: token, for future actions as well as the user's permissions
 */

router.post('/reauth', login.reauth);

/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     description: Logout user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: user's token
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: User has been logged out
 */

router.post('/logout', login.logout);

/**
 * @swagger
 * definition:
 *   Paragraphs:
 *     properties:
 *       type:
 *         type: string
 *       order:
 *         type: integer
 *       content:
 *         type: string
 *   News:
 *     properties:
 *       id:
 *         type: string
 *       url:
 *         type: string
 *       category:
 *         type: string
 *       published:
 *         type: dateTime
 *       title:
 *         type: string
 *       mainpicture:
 *         type: string
 *       summary:
 *         type: string
 *       paragraphs:
 *         items:
 *           $ref: '#/definitions/Paragraphs'
 */

/**
 * @swagger
 * /api/v1/admin/news:
 *   post:
 *     description: Upload a bunch of news.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: clientid
 *         description: the provider's username
 *         in: formdata
 *         required: true
 *         type: string
 *       - name: clientsecret
 *         description: the provider's password.
 *         in: formdata
 *         required: true
 *         type: string
 *       - name: data
 *         description: data to upload as a json array.
 *         in: body
 *         required: true
 *         type: application/json
 *         schema:
 *           $ref: '#/definitions/News'
 *     responses:
 *       200:
 *         description: the created providers names
 */

router.post('/admin/news', admin.addNews);

/**
 * @swagger
 * /api/v1/admin/cron:
 *   get:
 *     description: Make request from all the providers to get their news.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: the created providers names
 */

router.get('/admin/cron', admin.cron);

/**
 * @swagger
 * /api/v1/admin/create:
 *   get:
 *     description: Create a test provider, if it does not exist
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: the created provider
 */

router.get('/admin/create', admin.create);
router.get('/admin/create/pm', admin.createPM);
router.get('/admin/create/rm', admin.createRM);

module.exports = router;
