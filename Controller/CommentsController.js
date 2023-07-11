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
		var post_id = Number(req.query.post_id)
		var text = req.query.text ? req.query.text.trim() : null

		// Блок обработки ошибок
		if (!channel_id || !post_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		// Блок выполнения действия
		let channelWithCommentsCount = await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "comments_count": 1 } })
		var comment = { "id": channelWithCommentsCount.comments_count + 1, "post_id": post_id, "author": user._id, "text": text, "datetime": Date.now() }
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "comments": comment } })

		// Блок подготовки ответа
		var { id, text, datetime } = comment
		var item = { id, text, datetime }
		item.author = { "id": user.id, "name": user.name, "short_link": user.short_link }

		// Блок отправки ответа
		return response.send(item, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		// Блок получения query-параметров
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var count = !Number(req.query.count) || Number(req.query.count) < 1 ? Infinity : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		// Блок обработки ошибок
		if (!channel_id || !post_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		// Блок получения информации для ответа
		var channelWithComments = await Channel.aggregate([{ "$match": { "id": channel_id } }, { "$project": { "comments": { "$filter": { "input": "$comments", "cond": { "$eq": ["$$this.post_id", post_id] } } } } }])

		// Блок подготовки ответа
		await Channel.populate(channelWithComments, { "path": 'comments.author', "select": '-_id id name short_link' })
		var items = channelWithComments[0].comments.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset).map(item => ({ "id": item.id, "author": item.author, "text": item.text, "datetime": item.datetime }))

		// Блок отправки ответа
		return response.send({ "count": items.length, "total_amount": channelWithComments[0].comments.length, "items": items }, res)
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
		var comment_id = Number(req.query.comment_id)
		var text = req.query.text ? req.query.text.trim() : null

		// Блок обработки ошибок
		if (!channel_id || !comment_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithComment = await Channel.findOne({ "id": channel_id, "comments.id": comment_id }, "comments.$")
		if (!channelWithComment) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		if (channelWithComment.comments[0].author.id != user.id) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id, "comments.id": comment_id }, { "$set": { "comments.$.text": text } })

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
		var comment_id = Number(req.query.comment_id)

		// Блок обработки ошибок
		if (!channel_id || !comment_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }], res)
		let channelWithInactive = await Channel.findOne({ "id": channel_id }, 'inactive')
		if (!channelWithInactive || channelWithInactive.inactive) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithComment = await Channel.findOne({ "id": channel_id, "comments.id": comment_id }, "comments.$")
		await Channel.populate(channelWithComment, { "path": 'comments.author', "select": '-_id id name short_link' })
		if (!channelWithComment) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": user._id }, "subscribers.$")
		if (channelWithComment.comments[0].author.id != user.id && (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin)) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)

		// Блок выполнения действия
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "comments": { "id": comment_id } } })

		// Блок отправки ответа
		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}