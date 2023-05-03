'use strict'

const response = require('./../response')
const jwt = require('jsonwebtoken')
const config = require('./../config')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.auth = async (req, res) => {

	try {
		var name = req.query.name
		var short_link = req.query.short_link
		var ecost_id = req.token_payload.id

		if (req.token_payload.type != 'service_signup' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'service_signup') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'service_signup' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (await User.findOne({ "ecost_id": ecost_id })) return response.error(101, "the user is already registered", [{ "key": 'ecost_id', "value": ecost_id }], res)
		if (!name || !short_link) return response.error(4, "one of the required parameters was not passed", [{ "key": 'name', "value": 'required' }, { "key": 'short_link', "value": 'required' }], res)
		if (name.length > 16 || !short_link.match(/^[a-z\d\_\.]{3,32}$/i)) {
			let error_details = []
			if (name.length > 16) error_details.push({ "key": 'name', "value": name, "regexp": '/^.{1,16}$/' })
			if (!short_link.match(/^[a-z\d\_\.]{3,32}$/i)) error_details.push({ "key": 'short_link', "value": short_link, "regexp": '/^[a-z\\d\\_\\.]{3,32}$/i' })
			return response.error(5, "invalid parameter value", error_details, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.error(102, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		let user = new User({ "name": name, "short_link": short_link, "ecost_id": ecost_id })
		await user.save()

		let access_token = jwt.sign({
			"type": 'access',
			"service": 'specter',
			"ecost_id": ecost_id,
			"service_id": user._id
		}, config.JWT, { "expiresIn": '540d' })

		return response.send({ "access_token": `Bearer ${access_token}` }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}