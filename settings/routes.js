'use strict'

module.exports = app => {

	const versionsController = require('./../Controller/VersionsController')
	const tokenAccessController = require('./../Controller/TokenAccessController')
	const tokenAuthController = require('./../Controller/TokenAuthController')

	const accountController = require('./../Controller/AccountController')
	const authController = require('./../Controller/AuthController')
	const channelsController = require('./../Controller/ChannelsController')
	const commentsController = require('./../Controller/CommentsController')
	const postsController = require('./../Controller/PostsController')
	const subscribersController = require('./../Controller/SubscribersController')
	const usersController = require('./../Controller/UsersController')
	const utilsController = require('./../Controller/UtilsController')

	//	account
	app.route('/api/method/account.get').all(versionsController, tokenAccessController, accountController.get)
	app.route('/api/method/account.edit').all(versionsController, tokenAccessController, accountController.edit)

	//	auth
	app.route('/api/method/auth').all(versionsController, tokenAuthController, authController)

	//	channels
	app.route('/api/method/channels.create').all(versionsController, tokenAccessController, channelsController.create)
	app.route('/api/method/channels.getById').all(versionsController, tokenAccessController, channelsController.getById)
	app.route('/api/method/channels.get').all(versionsController, tokenAccessController, channelsController.get)
	app.route('/api/method/channels.search').all(versionsController, tokenAccessController, channelsController.search)
	app.route('/api/method/channels.subscribe').all(versionsController, tokenAccessController, channelsController.subscribe)
	app.route('/api/method/channels.unsubscribe').all(versionsController, tokenAccessController, channelsController.unsubscribe)
	app.route('/api/method/channels.edit').all(versionsController, tokenAccessController, channelsController.edit)
	app.route('/api/method/channels.delete').all(versionsController, tokenAccessController, channelsController.delete)

	//	comments
	app.route('/api/method/comments.create').all(versionsController, tokenAccessController, commentsController.create)
	app.route('/api/method/comments.get').all(versionsController, tokenAccessController, commentsController.get)
	app.route('/api/method/comments.edit').all(versionsController, tokenAccessController, commentsController.edit)
	app.route('/api/method/comments.delete').all(versionsController, tokenAccessController, commentsController.delete)

	//	posts
	app.route('/api/method/posts.create').all(versionsController, tokenAccessController, postsController.create)
	app.route('/api/method/posts.get').all(versionsController, tokenAccessController, postsController.get)
	app.route('/api/method/posts.edit').all(versionsController, tokenAccessController, postsController.edit)
	app.route('/api/method/posts.delete').all(versionsController, tokenAccessController, postsController.delete)

	//	subscribers
	app.route('/api/method/subscribers.get').all(versionsController, tokenAccessController, subscribersController.get)
	app.route('/api/method/subscribers.search').all(versionsController, tokenAccessController, subscribersController.search)
	app.route('/api/method/subscribers.setAdmin').all(versionsController, tokenAccessController, subscribersController.setAdmin)

	//	users
	app.route('/api/method/users.getById').all(versionsController, tokenAccessController, usersController.getById)
	app.route('/api/method/users.get').all(versionsController, usersController.get)

	//	utils
	app.route('/api/method/utils.getAndroidAppMinimumSupportedVersionCode').all(utilsController.getAndroidAppMinimumSupportedVersionCode)

	app.all('*', (req, res) => {

		const response = require('./../response')

		try {
			return response.sendError(2, "not found", res)
		} catch (error) {
			return response.sendSystemError(error, res)
		}

	})

}