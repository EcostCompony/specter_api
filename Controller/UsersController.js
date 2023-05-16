'use strict'

exports.get = async (req, res) => {

	const response = require('./../response')
	const User = require('./../models/User')

	try {
		var ecost_id = req.query.ecost_id

		let user = await User.findOne({ "ecost_id": ecost_id })

		if (!ecost_id) return response.error(6, "invalid request", [{ "key": 'ecost_id', "value": 'required' }], res)
		if (!user) return response.error(1000, "the user is not registered", [{ "key": 'ecost_id', "value": ecost_id }], res)

		return response.send({ "service_id": user.id }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}