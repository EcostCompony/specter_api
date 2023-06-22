'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		return response.send(await User.findOne({ "id": req.token_payload.service_id }, "-_id id name short_link ecost_id"), res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var name = req.query.name.trim()
		var short_link = req.query.short_link.trim()
		var id = req.token_payload.service_id

		if (!name && !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'name', "value": 'optional*' }, { "key": 'short_link', "value": 'optional*' }], res)
		if (name && name.length > 64 || short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) {
			let error_details = []
			if (name && name.length > 64) error_details.push({ "key": 'name', "value": name })
			if (short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) error_details.push({ "key": 'short_link', "value": short_link })
			return response.sendDetailedError(7, "invalid parameter value", error_details, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.sendDetailedError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		if (name) await User.findOneAndUpdate({ "id": id }, { "name": name })
		if (short_link) await User.findOneAndUpdate({ "id": id }, { "short_link": short_link })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}