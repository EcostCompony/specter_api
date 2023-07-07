'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var text = req.query.text ? req.query.text.trim() : null
		var user = await User.findOne({ "id": req.token_payload.service_id })

		if (!channel_id || !post_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		let channelWithCommentsCount = await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "comments_count": 1 } })
		let comment = { "id": channelWithCommentsCount.comments_count + 1, "post_id": post_id, "author": user._id, "text": text, "datetime": Date.now() }
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "comments": comment } })

		return response.send({ "id": comment.id, "author": { "id": user.id, "name": user.name, "short_link": user.short_link }, "text": comment.text, "datetime": comment.datetime }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var count = !Number(req.query.count) || req.query.count < 1 ? 100000000 : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		if (!channel_id || !post_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		var channelWithComments = await Channel.aggregate([{ "$match": { "id": channel_id } }, { "$project": { "comments": { "$filter": { "input": "$comments", "cond": { "$eq": ["$$this.post_id", post_id] } } } } }])
		await Channel.populate(channelWithComments, { "path": 'comments.author', "select": '-_id id name short_link' })

		return response.send({ "count": channelWithComments[0].comments.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset).length, "total_amount": channelWithComments[0].comments.length, "items": channelWithComments[0].comments.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset).map(item => ({ "id": item.id, "author": item.author, "text": item.text, "datetime": item.datetime })) }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var comment_id = Number(req.query.comment_id)
		var text = req.query.text ? req.query.text.trim() : null
		var id = req.token_payload.service_id

		if (!channel_id || !comment_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithComment = await Channel.findOne({ "id": channel_id, "comments.id": comment_id }, "comments.$")
		if (!channelWithComment) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		if (channelWithComment.comments[0].author.id != id) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "comments.id": comment_id }, { "$set": { "comments.$.text": text } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var comment_id = Number(req.query.comment_id)
		var id = req.token_payload.service_id

		if (!channel_id || !comment_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithComment = await Channel.findOne({ "id": channel_id, "comments.id": comment_id }, "comments.$")
		if (!channelWithComment) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (channelWithComment.comments[0].author.id != id && (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin)) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "comments": { "id": comment_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}