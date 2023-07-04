'use strict'

const response = require('./../response')
const User = require('./../models/User')

exports.getById = async (req, res) => {

	try {
		var user_id = Number(req.query.user_id)

		if (!user_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'user_id', "value": 'required' }], res)

		var user = await User.findOne({ "id": user_id }, "-_id id name short_link")
		if (!user) return response.sendDetailedError(50, "not exist", [{ "key": 'user_id', "value": user_id }], res)

		return response.send(user, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

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