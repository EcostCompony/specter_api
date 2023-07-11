'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var id = req.token_payload.service_id

		// Блок получения query-параметров
		var rawFields = req.query.fields ? req.query.fields.trim().toLowerCase().split(' ') : null

		// Блок обработки fields
		var fields = ''
		for (let i in rawFields) if (rawFields[i].match(/^(ecost_id)$/)) fields += ' ' + rawFields[i]

		// Блок получения информации для ответа
		var item = await User.findOne({ "id": id }, '-_id id name short_link' + fields)

		// Блок отправки ответа
		return response.send(item, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var id = req.token_payload.service_id

		// Блок получения query-параметров
		var name = req.query.name ? req.query.name.trim() : null
		var short_link = req.query.short_link ? req.query.short_link.trim().toLowerCase() : null

		// Блок обработки ошибок
		if (!name && !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'name', "value": 'optional*' }, { "key": 'short_link', "value": 'optional*' }], res)
		if (name && name.length > 64 || short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) {
			let errorDetails = []
			if (name && name.length > 64) errorDetails.push({ "key": 'name', "value": name })
			if (short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) errorDetails.push({ "key": 'short_link', "value": short_link })
			return response.sendDetailedError(7, "invalid parameter value", errorDetails, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.sendDetailedError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		// Блок выполнения действия
		if (name) await User.findOneAndUpdate({ "id": id }, { "name": name })
		if (short_link) await User.findOneAndUpdate({ "id": id }, { "short_link": short_link })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}