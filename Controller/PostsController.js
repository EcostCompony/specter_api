'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		// Блок инициализации используемых переменных
		var user = await User.findOne({ "id": req.token_payload.service_id })

		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var author = Number(req.query.author)
		var text = req.query.text ? req.query.text.trim() : null

		// Блок обработки ошибок
		if (!channel_id || !author || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'author', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (text == '' || author < 1 || author > 2) {
			let errorDetails = []
			if (text == '') errorDetails.push({ "key": 'text', "value": text })
			if (author < 1 || author > 2) errorDetails.push({ "key": 'author', "value": author })
			return response.sendDetailedError(7, "invalid parameter value", errorDetails, res)
		}

		// Блок выполнения действия
		let channelWithPostsCount = await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "posts_count": 1 } })
		var post = { "id": channelWithPostsCount.posts_count + 1, "author": { "id": author === 1 ? 0 : user.id, "name": author === 1 ? '%CHANNEL_TITLE%' : user.name }, "text": text, "datetime": Date.now() } 
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "posts": post } })

		// Блок отправки ответа
		return response.send(post, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var count = !Number(req.query.count) || Number(req.query.count) < 1 ? Infinity : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		// Блок обработки ошибок
		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'count', "value": 'optional' }, { "key": 'offset', "value": 'optional' }], res)

		// Блок получения информации для ответа
		var channelWithPosts = await Channel.findOne({ "id": channel_id }, 'inactive posts.id posts.author posts.text posts.datetime')
		if (!channelWithPosts || channelWithPosts.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		// Блок подготовки ответа
		var items = channelWithPosts.posts.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset)

		// Блок отправки ответа
		return response.send({ "count": items.length, "total_amount": channelWithPosts.posts.length, "items": items }, res)
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
		var post_id = Number(req.query.post_id)
		var text = req.query.text ? req.query.text.trim() : null

		// Блок обработки ошибок
		if (!channel_id || !post_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$set": { "posts.$.text": text } })

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
		var post_id = Number(req.query.post_id)

		// Блок обработки ошибок
		if (!channel_id || !post_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "posts": { "id": post_id } } })
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "comments": { "post_id": post_id } } })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}