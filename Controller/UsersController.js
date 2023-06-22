'use strict'

exports.get = async (req, res) => {

	const response = require('./../response')
	const User = require('./../models/User')

	try {
		var ecost_id = Number(req.query.ecost_id)

		let user = await User.findOne({ "ecost_id": ecost_id })

		if (!ecost_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'ecost_id', "value": 'required' }], res)
		if (!user) return response.sendError(1000, "the user is not registered", res)

		return response.send({ "service_id": user.id }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}