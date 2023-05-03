'use strict'

module.exports = app => {

	const tokenController = require('./../Controller/TokenController')
	const authController = require('./../Controller/AuthController')
	const accountController = require('./../Controller/AccountController')
	const usersController = require('./../Controller/UsersController')
	const channelController = require('./../Controller/ChannelController')

	app.all('*', (req, res, next) => {
		if (!req.query.v) return require('./../response').error(4, "one of the required parameters was not passed", [{ "key": 'v', "value": 'required' }], res)
		return next()
	})

	//	auth
	app.route('/api/method/auth').post(tokenController.control, authController.auth)

	//	account
	app.route('/api/method/account.getChannels').get(tokenController.control, accountController.getChannels)

	//	users
	app.route('/api/method/users.getUserId').get(usersController.getUserId)

	//	channel
	app.route('/api/method/channel.createChannel').post(tokenController.control, channelController.createChannel)
	app.route('/api/method/channel.getChannel').get(tokenController.control, channelController.getChannel)
	app.route('/api/method/channel.searchChannels').get(tokenController.control, channelController.searchChannels)
	app.route('/api/method/channel.getPosts').get(tokenController.control, channelController.getPosts)

}