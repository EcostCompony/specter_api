'use strict'

module.exports = (req, res, next) => {

	const response = require('./../response')

	try {
		require('passport').authenticate('jwt', { "session": false }, (error, user, info) => {
			if (error) return response.sendSystemError(error, res)
			if (info && info.message === "No auth token") return response.sendError(3, "the access token was not transferred", res)
			if (!user || user.type != 'service_signup' || user.service != 'specter') return response.sendError(4, "invalid access token", res)

			req.token_payload = user

			return next()
		})(req, res, next)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}