'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var text = req.query.text.trim()
		var id = req.token_payload.service_id

		if (!channel_id || !post_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithPost = await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')
		if (!channelWithPost) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		var comment = {
			"id": channelWithPost.posts[0].comments_count + 1,
			"author_id": id,
			"text": text,
			"datetime": Date.now()
		}

		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$inc": { "posts.$.comments_count": 1 }, "$push": { "posts.$.comments": comment } })

		return response.send({
			"id": comment.id,
			"author": {
				"id": id,
				"name": (await User.findOne({ "id": id })).name
			},
			"text": comment.text,
			"datetime": comment.datetime
		}, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)

		if (!channel_id || !post_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		var channelWithPost = await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts.$')
		if (!channelWithPost) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		var comments = channelWithPost.posts[0].comments

		for (let i in comments) {
			delete comments[i]._doc._id
			comments[i]._doc.author = { "id": comments[i]._doc.author_id, "name": (await User.findOne({ "id": comments[i]._doc.author_id })).name }
			delete comments[i]._doc.author_id
		}

		return response.send(comments, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var comment_id = Number(req.query.comment_id)
		var text = req.query.text.trim()
		var id = req.token_payload.service_id

		if (!channel_id || !post_id || !comment_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		let channelWithComment = await Channel.aggregate([{ "$match": { "id": channel_id } }, { "$unwind": '$posts' }, { "$match": { "posts.id": post_id } }, { "$unwind": '$posts.comments' }, { "$match": { "posts.comments.id": comment_id } }, { "$project": { "comment": "$posts.comments" } }])
		if (!channelWithComment[0]) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		if (channelWithComment[0].comment.author_id != id) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$set": { "posts.$[i].comments.$[j].text": text} }, { "arrayFilters": [{ "i.id": post_id }, { "j.id": comment_id }] })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var comment_id = Number(req.query.comment_id)
		var id = req.token_payload.service_id

		if (!channel_id || !post_id || !comment_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		let channelWithComment = await Channel.aggregate([{ "$match": { "id": channel_id } }, { "$unwind": '$posts' }, { "$match": { "posts.id": post_id } }, { "$unwind": '$posts.comments' }, { "$match": { "posts.comments.id": comment_id } }, { "$project": { "comment": "$posts.comments" } }])
		if (!channelWithComment[0]) return response.sendDetailedError(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (channelWithComment[0].comment.author_id != id && (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin)) return response.sendDetailedError(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$pull": { "posts.$.comments": { "id": comment_id } } });

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}