'use strict'

module.exports = app => {

	const tokenController = require('./../Controller/TokenController')
	const authController = require('./../Controller/AuthController')
	const usersController = require('./../Controller/UsersController')

	app.all('*', (req, res, next) => {
		if (!req.query.v) return require('./../response').error(4, "one of the required parameters was not passed", [{ "key": 'v', "value": 'required' }], res)
		return next()
	})

	//	auth
	app.route('/api/method/auth').post(tokenController.control, authController.auth)

	//	users
	app.route('/api/method/users.getUserId').get(usersController.getUserId)

}