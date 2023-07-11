'use strict'

const response = require('./../response')
const sequenceController = require('./SequenceController')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var title = req.query.title ? req.query.title.trim() : null
		var short_link = req.query.short_link ? req.query.short_link.trim().toLowerCase() : null
		var category = Number(req.query.category)
		var description = req.query.description ? req.query.description.trim() : null

		// Блок обработки ошибок
		if (!title || !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'title', "value": 'required' }, { "key": 'short_link', "value": 'required' }, { "key": 'category', "value": 'optional' }, { "key": 'description', "value": 'optional' }], res)
		if (title.length > 64 || !short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4 || category && (category < 0 || category > 2) || description && description.length > 256) {
			let errorDetails = []
			if (title.length > 64) errorDetails.push({ "key": 'title', "value": title })
			if (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) errorDetails.push({ "key": 'short_link', "value": short_link })
			if (category && (category < 0 || category > 2)) errorDetails.push({ "key": 'category', "value": category })
			if (description && description.length > 256) errorDetails.push({ "key": 'description', "value": description })
			return response.sendDetailedError(7, "invalid parameter value", errorDetails, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.sendError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		// Блок выполнения действия
		var channel = await new Channel({ "id": await sequenceController.getNextSequence('channels'), "title": title, "short_link": short_link, "category": category ? category : 0, "description": description ? description : null, "subscribers": [{ "user": user._id, "is_admin": 1 }] }).save()

		// Блок подготовки ответа
		var { id, title, short_link, category, subscribers_count } = channel
		var item = { id, title, short_link, category, subscribers_count }
		item.is_subscriber = 1
		item.is_admin = 1
		if (description) item.description = description

		// Блок отправки ответа
		return response.send(item, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.getById = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var rawFields = req.query.fields ? req.query.fields.trim().toLowerCase().split(' ') : null

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'fields', "value": 'optional' }], res)

		// Блок обработки fields
		var fields = ''
		for (let i in rawFields) if (rawFields[i].match(/^(category|description|subscribers_count)$/)) fields += ' ' + rawFields[i]

		// Блок получения информации для ответа
		var channel = await Channel.findOne({ "id": channel_id }, '-_id id title short_link inactive' + fields)
		if (!channel) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок подготовки ответа
		var item = channel._doc
		var channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		item.is_subscriber = channelWithSubsriber ? 1 : 0
		item.is_admin = channelWithSubsriber ? channelWithSubsriber.subscribers[0].is_admin : 0
		if (!item.description) delete item.description
		if (item.inactive) {
			let { id, title, short_link, inactive, is_admin, is_subscriber } = item
			item = { id, title, short_link, inactive, is_admin, is_subscriber }
		}

		// Блок отправки ответа
		return response.send(item, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var rawFields = req.query.fields ? req.query.fields.trim().toLowerCase().split(' ') : null
		var count = !Number(req.query.count) || Number(req.query.count) < 1 ? Infinity : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		// Блок обработки fields
		var fields = ''
		for (let i in rawFields) if (rawFields[i].match(/^(category|description|subscribers_count)$/)) fields += ' ' + rawFields[i]

		// Блок получения информации для ответа
		var channels = await Channel.find({ "subscribers.user": user._id }, '-_id id title short_link inactive' + fields)

		// Блок подготовки ответа
		var items = channels.slice(offset, count + offset)
		for (let i in items) {
			items[i]._doc.is_subscriber = 1
			items[i]._doc.is_admin = (await Channel.findOne({ "id": channels[i].id, "subscribers.user": user._id }, 'subscribers.$')).subscribers[0].is_admin
			if (!items[i].description) delete items[i]._doc.description
			if (items[i].inactive) {
				let { id, title, short_link, inactive, is_admin, is_subscriber } = items[i]._doc
				items[i]._doc = { id, title, short_link, inactive, is_admin, is_subscriber }
			}
		}

		// Блок отправки ответа
		return response.send({ "count": items.length, "total_amount": channels.length, "items": items }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var q = req.query.q ? req.query.q.trim() : null
		var rawFields = req.query.fields ? req.query.fields.trim().toLowerCase().split(' ') : null
		var count = !Number(req.query.count) || Number(req.query.count) < 1 ? Infinity : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		// Блок обработки ошибок
		if (!q) return response.sendDetailedError(6, "invalid request", [{ "key": 'q', "value": 'required' }, { "key": 'fields', "value": 'optional' }, { "key": 'count', "value": 'optional' }, { "key": 'offset', "value": 'optional' }], res)

		// Блок обработки fields
		var fields = ''
		for (let i in rawFields) if (rawFields[i].match(/^(category|description|subscribers_count)$/)) fields += ' ' + rawFields[i]

		// Блок получения информации для ответа
		var channels = await Channel.find({ "$and": [{ "inactive": null }, { "$or": [{ "title": { "$regex": `(?i)${q}` } }, { "short_link": { "$regex": `(?i)${q}` } }] }] }, '-_id id title short_link' + fields)

		// Блок подготовки ответа
		var items = channels.slice(offset, count + offset)
		for (let i in items) {
			var channelWithSubsriber = await Channel.findOne({ "id": items[i].id, "subscribers.user": user._id }, "subscribers.$")
			items[i]._doc.is_subscriber = channelWithSubsriber ? 1 : 0
			items[i]._doc.is_admin = channelWithSubsriber ? channelWithSubsriber.subscribers[0].is_admin : 0
			if (!items[i].description) delete items[i]._doc.description
		}

		// Блок отправки ответа
		return response.send({ "count": items.length, "total_amount": channels.length, "items": items }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.subscribe = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (await Channel.findOne({ "id": channel_id, "subscribers.user": user._id })) return response.sendError(300, "the user is already subscribed", res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "subscribers_count": 1 }, "$push": { "subscribers": { "user": user._id } } })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.unsubscribe = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber) return response.sendError(301, "the user is not subscribed", res)
		if (channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "subscribers_count": -1 }, "$pull": { "subscribers": { "user": user._id } } })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var title = req.query.title ? req.query.title.trim() : null
		var short_link = req.query.short_link ? req.query.short_link.trim().toLowerCase() : null
		var category = Number(req.query.category)
		var description = req.query.description

		// Блок обработки ошибок
		if (!channel_id || !title && !short_link && !category && category !== 0 && !description) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'title', "value": 'optional*' }, { "key": 'short_link', "value": 'optional*' }, { "key": 'category', "value": 'optional*' }, { "key": 'description', "value": 'optional*' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (title && title.length > 64 || short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) || category && (category < 0 || category > 2) || description && description.length > 256) {
			let errorDetails = []
			if (title && title.length > 64) errorDetails.push({ "key": 'title', "value": title })
			if (short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) errorDetails.push({ "key": 'short_link', "value": short_link })
			if (category && (category < 0 || category > 2)) errorDetails.push({ "key": 'category', "value": category })
			if (description && description.length > 256) errorDetails.push({ "key": 'description', "value": description })
			return response.sendDetailedError(7, "invalid parameter value", errorDetails, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.sendDetailedError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		// Блок выполнения действия
		if (title) await Channel.findOneAndUpdate({ "id": channel_id }, { "title": title })
		if (short_link) await Channel.findOneAndUpdate({ "id": channel_id }, { "short_link": short_link })
		if (category || category === 0) await Channel.findOneAndUpdate({ "id": channel_id }, { "category": category })
		if (description) await Channel.findOneAndUpdate({ "id": channel_id }, { "description": description.trim() == "" ? null : description })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id }, { "inactive": 1 })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}