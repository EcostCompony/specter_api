'use strict'

module.exports = app => {

	const tokenController = require('./../Controller/TokenController')
	const authController = require('./../Controller/AuthController')
	const usersController = require('./../Controller/UsersController')
	const channelsController = require('./../Controller/ChannelsController')
	const postsController = require('./../Controller/PostsController')
	const commentsController = require('./../Controller/CommentsController')

	app.all('*', (req, res, next) => {
		if (!req.query.v) return require('./../response').error(4, "one of the required parameters was not passed", [{ "key": 'v', "value": 'required' }], res)
		return next()
	})

	//	auth
	app.route('/api/method/auth').all(tokenController.control, authController.auth)

	//	users
	app.route('/api/method/users.get').all(usersController.get)

	//	channels
	app.route('/api/method/channels.create').post(tokenController.control, channelsController.create)
	app.route('/api/method/channels.getById').get(tokenController.control, channelsController.getById)
	app.route('/api/method/channels.get').get(tokenController.control, channelsController.get)
	app.route('/api/method/channels.search').get(tokenController.control, channelsController.search)
	app.route('/api/method/channels.editTitle').post(tokenController.control, channelsController.editTitle)
	app.route('/api/method/channels.editShortLink').post(tokenController.control, channelsController.editShortLink)
	app.route('/api/method/channels.editCategory').post(tokenController.control, channelsController.editCategory)
	app.route('/api/method/channels.editDescription').post(tokenController.control, channelsController.editDescription)

	//	posts
	app.route('/api/method/posts.create').put(tokenController.control, postsController.create)
	app.route('/api/method/posts.get').delete(tokenController.control, postsController.get)
	app.route('/api/method/posts.edit').get(tokenController.control, postsController.edit)
	app.route('/api/method/posts.delete').post(tokenController.control, postsController.delete)

	//	comments
	app.route('/api/method/comments.create').put(tokenController.control, commentsController.create)
	app.route('/api/method/comments.get').delete(tokenController.control, commentsController.get)
	app.route('/api/method/comments.edit').delete(tokenController.control, commentsController.edit)
	app.route('/api/method/comments.delete').delete(tokenController.control, commentsController.delete)

}