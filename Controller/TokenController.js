'use strict'

const passport = require('passport')
const response = require('./../response')

exports.control = (req, res, next) => {

	passport.authenticate('jwt', { session: false }, (error, user, info) => {
		if (error) response.error(1, "unknown error", res)
		else if (info && info.message === "No auth token") response.error(2, "the access token was not transferred", res)
		else if (!user) response.error(3, "invalid access token", res)
		else {
			req.data_token = user
			return next()
		}
	})(req, res, next)

}