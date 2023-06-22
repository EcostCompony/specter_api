'use strict'

module.exports = async (req, res) => {

	const response = require('./../response')
	const sequenceController = require('./SequenceController')
	const User = require('./../models/User')
	const Channel = require('./../models/Channel')

	try {
		var name = req.query.name.trim()
		var short_link = req.query.short_link.trim()
		var ecost_id = req.token_payload.ecost_id

		if (!name || !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'name', "value": 'required' }, { "key": 'short_link', "value": 'required' }], res)
		if (await User.findOne({ "ecost_id": ecost_id })) return response.sendError(1001, "the user is already registered", res)
		if (name.length > 64 || !short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) {
			let error_details = []
			if (name.length > 64) error_details.push({ "key": 'name', "value": name })
			if (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) error_details.push({ "key": 'short_link', "value": short_link })
			return response.sendDetailedError(7, "invalid parameter value", error_details, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.sendDetailedError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		let specter_id = await sequenceController.getNextSequence('users')
		await new User({ "id": specter_id, "name": name, "short_link": short_link, "ecost_id": ecost_id }).save()

		let access_token = require('jsonwebtoken').sign({
			"type": 'access',
			"service": 'specter',
			"ecost_id": ecost_id,
			"service_id": specter_id
		}, require('./../config').JWT_SECRET_KEY, { "expiresIn": '540d' })

		return response.send({ "access_token": `Bearer ${access_token}` }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}