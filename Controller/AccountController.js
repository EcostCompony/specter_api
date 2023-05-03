'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.getChannels = async (req, res) => {

	try {
		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		let channels = await Channel.find({ "subscribers._id": req.token_payload.service_id }, 'title short_link category description')
		return response.send(channels, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}