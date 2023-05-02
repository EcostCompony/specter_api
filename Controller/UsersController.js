'use strict'

const response = require('./../response')
const User = require('./../models/User')

exports.getUserId = async (req, res) => {

	try {
		var ecost_id = req.query.ecost_id

		let user = await User.findOne({ "ecost_id": ecost_id })

		if (!ecost_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'ecost_id', "value": 'required' }], res)
		if (!user) return response.error(100, "the user is not registered", [{ "key": 'ecost_id', "value": ecost_id }], res)

		return response.send({ "service_id": user._id }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}