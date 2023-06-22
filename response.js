'use strict'

exports.send = (values, res) => res.json({ "res": values }).end()

exports.sendError = (code, message, res) => {

	res.json({
		"error": {
			"code": code,
			"message": message
		}
	}).end()

}

exports.sendDetailedError = (code, message, details, res) => {

	res.json({
		"error": {
			"code": code,
			"message": message,
			"details": details
		}
	}).end()

}

exports.sendSystemError = (error, res) => {

	console.log(error)
	res.json({
		"error": {
			"code": 1,
			"message": "unknown error"
		}
	}).end()

}