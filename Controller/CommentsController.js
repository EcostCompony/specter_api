'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id
		var text = req.query.text

		if (!channel_id || !post_id || !text) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		var channelPost = await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')
		if (!channelPost) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text.trim() == '') return response.error(7, "invalid parameter value", [{ "key": 'text', "value": text, "requirement": '/./' }], res)

		var comment_id = channelPost.posts[0].comments_count + 1
		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$set": { "posts.$.comments_count": comment_id } })

		let comment = { "id": comment_id, "author_id": req.token_payload.service_id, "text": text, "datetime": Date.now() }
		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$push": { "posts.$.comments": comment } })

		return response.send(comment, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id

		if (!channel_id || !post_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		var channelPost = await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')
		if (!channelPost) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		for (let i in channelPost.posts[0].comments) channelPost.posts[0].comments[i].author_name = (await User.findOne({ "id": channelPost.posts[0].comments[i].author_id }, '-_id name')).name

		return response.send(channelPost.posts[0].comments.map((item) => ({ "id": item.id, "author_id": item.author_id, "author_name": item.author_name, "text": item.text, "datetime": item.datetime })), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id
		var comment_id = req.query.comment_id
		var text = req.query.text

		if (!channel_id || !post_id || !comment_id || !text) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		let comment = await Channel.aggregate([{ "$match": { "id": Number(channel_id) } }, { "$unwind": '$posts' }, { "$match": { "posts.id": Number(post_id) } }, { "$unwind": '$posts.comments' }, { "$match": { "posts.comments.id": Number(comment_id) } }, { "$project": { "comment": "$posts.comments" } }])
		if (comment[0]) comment = comment[0].comment
		if (!comment.id) return response.error(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		if (comment.author_id != req.token_payload.service_id) return response.error(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)
		if (text.trim() == '') return response.error(7, "invalid parameter value", [{ "key": 'text', "value": text, "requirement": '/./' }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$set": { "posts.$[i].comments.$[j].text": text} }, { "arrayFilters": [{ "i.id": post_id }, { "j.id": comment_id }] })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id
		var comment_id = req.query.comment_id

		if (!channel_id || !post_id || !comment_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'comment_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		let comment = await Channel.aggregate([{ "$match": { "id": Number(channel_id) } }, { "$unwind": '$posts' }, { "$match": { "posts.id": Number(post_id) } }, { "$unwind": '$posts.comments' }, { "$match": { "posts.comments.id": Number(comment_id) } }, { "$project": { "comment": "$posts.comments" } }])
		if (comment[0]) comment = comment[0].comment
		if (!comment.id) return response.error(50, "not exist", [{ "key": 'comment_id', "value": comment_id }], res)
		if (comment.author_id != req.token_payload.service_id) return response.error(8, "access denied", [{ "key": 'comment_id', "value": comment_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$pull": { "posts.$.comments": { "id": comment_id } } });

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}