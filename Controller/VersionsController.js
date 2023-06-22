'use strict'

module.exports = (req, res, next) => {

	const response = require('./../response')

	try {
		let v = req.query.v

		return !v || v !== '0.7' ? response.sendDetailedError(6, "invalid request", [{ "key": 'v', "value": v ? v : 'required' }], res) : next()
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}