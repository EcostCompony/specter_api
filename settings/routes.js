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
	app.route('/api/method/account.get').all(tokenAccessController, versionsController, accountController.get)
	app.route('/api/method/account.edit').all(tokenAccessController, versionsController, accountController.edit)

	//	auth
	app.route('/api/method/auth').all(tokenAuthController, versionsController, authController)

	//	channels
	app.route('/api/method/channels.create').all(tokenAccessController, versionsController, channelsController.create)
	app.route('/api/method/channels.getById').all(tokenAccessController, versionsController, channelsController.getById)
	app.route('/api/method/channels.get').all(tokenAccessController, versionsController, channelsController.get)
	app.route('/api/method/channels.search').all(tokenAccessController, versionsController, channelsController.search)
	app.route('/api/method/channels.subscribe').all(tokenAccessController, versionsController, channelsController.subscribe)
	app.route('/api/method/channels.unsubscribe').all(tokenAccessController, versionsController, channelsController.unsubscribe)
	app.route('/api/method/channels.edit').all(tokenAccessController, versionsController, channelsController.edit)
	app.route('/api/method/channels.delete').all(tokenAccessController, versionsController, channelsController.delete)

	//	comments
	app.route('/api/method/comments.create').all(tokenAccessController, versionsController, commentsController.create)
	app.route('/api/method/comments.get').all(tokenAccessController, versionsController, commentsController.get)
	app.route('/api/method/comments.edit').all(tokenAccessController, versionsController, commentsController.edit)
	app.route('/api/method/comments.delete').all(tokenAccessController, versionsController, commentsController.delete)

	//	posts
	app.route('/api/method/posts.create').all(tokenAccessController, versionsController, postsController.create)
	app.route('/api/method/posts.get').all(tokenAccessController, versionsController, postsController.get)
	app.route('/api/method/posts.edit').all(tokenAccessController, versionsController, postsController.edit)
	app.route('/api/method/posts.delete').all(tokenAccessController, versionsController, postsController.delete)

	//	subscribers
	app.route('/api/method/subscribers.get').all(tokenAccessController, versionsController, subscribersController.get)
	app.route('/api/method/subscribers.search').all(tokenAccessController, versionsController, subscribersController.search)
	app.route('/api/method/subscribers.setAdmin').all(tokenAccessController, versionsController, subscribersController.setAdmin)

	//	users
	app.route('/api/method/users.getById').all(tokenAccessController, versionsController, usersController.getById)
	app.route('/api/method/users.get').all(versionsController, usersController.get)

	//	utils
	app.route('/api/method/utils.getAndroidAppMinimumSupportedVersionCode').all(versionsController, utilsController.getAndroidAppMinimumSupportedVersionCode)

	app.all('*', (req, res) => {

		const response = require('./../response')

		try {
			return response.sendError(2, "not found", res)
		} catch (error) {
			return response.sendSystemError(error, res)
		}

	})

}