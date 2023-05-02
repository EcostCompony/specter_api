'use strict'

const response = require('./../response')
const User = require('./../models/User')

exports.isUserByEcostId = async (req, res) => {

	try {
		var ecost_id = req.query.ecost_id
		if (!ecost_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'ecost_id', "value": 'required' }], res)
		return response.send(await User.findOne({ "ecost_id": ecost_id }) ? 1 : 0, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}