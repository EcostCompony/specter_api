'use strict'

module.exports = (app) => {

	const utilsController = require('./../Controller/UtilsController')

	app.all('*', (req, res, next) => {
		if (!req.query.v) return require('./../response').error(4, "one of the required parameters was not passed", [{ "key": 'v', "value": 'required' }], res)
		return next()
	})

	//	utils
	app.route('/api/method/utils.isUserByEcostId').get(utilsController.isUserByEcostId)

}