'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var count = !Number(req.query.count) || Number(req.query.count) < 1 ? Infinity : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)

		// Блок получения информации для ответа
		var channelWithSubscribers = await Channel.findOne({ "id": channel_id }, 'inactive subscribers.user subscribers.is_admin')
		if (!channelWithSubscribers || channelWithSubscribers.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок обработки ошибок
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок подготовки ответа
		await Channel.populate(channelWithSubscribers, { "path": 'subscribers.user', "select": '-_id id name short_link' })
		var items = channelWithSubscribers.subscribers.slice(offset, count + offset)

		// Блок отправки ответа
		return response.send({ "count": items.length, "total_amount": channelWithSubscribers.subscribers.length, "items": items }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var short_link = req.query.short_link ? req.query.short_link.trim() : req.query.short_link

		// Блок обработки ошибок
		if (!channel_id || !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'short_link', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок получения информации для ответа
		var userByShortLink = await User.findOne({ "short_link": short_link })
		if (!userByShortLink) return response.sendDetailedError(50, "not exist", [{ "key": 'short_link', "value": short_link }], res)
		var subscriberByShortLink = await Channel.findOne({ "id": channel_id, "subscribers.user": userByShortLink._id }, "subscribers.$")
		if (!subscriberByShortLink) return response.sendDetailedError(50, "not exist", [{ "key": 'short_link', "value": short_link }], res)

		// Блок подготовки ответа
		await Channel.populate(subscriberByShortLink, { "path": 'subscribers.user', "select": '-_id id name short_link' })
		var { user, is_admin } = subscriberByShortLink.subscribers[0]

		// Блок отправки ответа
		return response.send({ user, is_admin }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.setAdmin = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var user_id = Number(req.query.user_id)

		// Блок обработки ошибок
		if (!channel_id || !user_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'user_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		var subscriberUser = await User.findOne({ "id": user_id })
		channelWithSubscriber2 = await Channel.findOne({ "id": channel_id, "subscribers.user": subscriberUser._id }, "subscribers.$")
		if (!channelWithSubscriber2) return response.sendDetailedError(50, "not exist", [{ "key": 'user_id', "value": user_id }], res)
		if (channelWithSubscriber2.subscribers[0].is_admin) return response.sendError(600, "the user is already an admin", res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id, "subscribers.user": subscriberUser._id }, { "$set": { "subscribers.$.is_admin": 1 } })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}