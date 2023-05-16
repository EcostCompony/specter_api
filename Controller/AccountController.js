'use strict'

const response = require('./../response')
const User = require('./../models/User')

exports.get = async (req, res) => {

	try {
		return response.send(await User.findOne({ "id": req.token_payload.service_id }, "-_id id name short_link ecost_id"), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.edit = async (req, res) => {

	const Channel = require('./../models/Channel')

	try {
		var name = req.query.name
		var short_link = req.query.short_link
		var specter_id = req.token_payload.service_id

		if (!name && !short_link) return response.error(6, "invalid request", [{ "key": 'name', "value": 'required|optional' }, { "key": 'short_link', "value": 'required|optional' }], res)
		if (name && name.length > 16 || short_link && !short_link.match(/^[a-z\d\_\.]{3,32}$/i)) {
			let error_details = []
			if (name && name.length > 16) error_details.push({ "key": 'name', "value": name, "regex": '/^.{1,16}$/' })
			if (short_link && !short_link.match(/^[a-z\d\_\.]{3,32}$/i)) error_details.push({ "key": 'short_link', "value": short_link, "regex": '/^[a-z\\d\\_\\.]{3,32}$/i' })
			return response.error(7, "invalid parameter value", error_details, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.error(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		if (name) await User.findOneAndUpdate({ "id": specter_id }, { "name": name })
		if (short_link) await User.findOneAndUpdate({ "id": specter_id }, { "short_link": short_link })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}