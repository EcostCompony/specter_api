'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var author = Number(req.query.author)
		var text = req.query.text ? req.query.text.trim() : null
		var id = (await User.findOne({ "id": req.token_payload.service_id }))._id

		if (!channel_id || !author || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'author', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (text == '' || author < 1 || author > 2) {
			let error_details = []
			if (text == '') error_details.push({ "key": 'text', "value": text })
			if (author < 1 || author > 2) error_details.push({ "key": 'author', "value": author })
			return response.sendDetailedError(7, "invalid parameter value", error_details, res)
		}

		let channelWithPostsCount = await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "posts_count": 1 } })
		let post = { "id": channelWithPostsCount.posts_count + 1, "author": { "id": author === 1 ? 0 : req.token_payload.service_id, "name": author === 1 ? '%CHANNEL_TITLE%' : (await User.findOne({ "_id": id })).name }, "text": text, "datetime": Date.now() } 
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "posts": post } })

		return response.send(post, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var count = !Number(req.query.count) || req.query.count < 1 ? 100000000 : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)

		var channelWithPosts = await Channel.findOne({ "id": channel_id }, 'posts')
		if (!channelWithPosts) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		return response.send({ "count": channelWithPosts.posts.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset).length, "total_amount": channelWithPosts.posts.length, "items": channelWithPosts.posts.sort((a, b) => b.datetime - a.datetime).slice(offset, count + offset).map(item => ({ "id": item.id, "author": item.author, "text": item.text, "datetime": item.datetime })) }, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var text = req.query.text ? req.query.text.trim() : null
		var id = (await User.findOne({ "id": req.token_payload.service_id }))._id

		if (!channel_id || !post_id || !text) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text == '') return response.sendDetailedError(7, "invalid parameter value", [{ "key": 'text', "value": text }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$set": { "posts.$.text": text } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var post_id = Number(req.query.post_id)
		var id = (await User.findOne({ "id": req.token_payload.service_id }))._id

		if (!channel_id || !post_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "posts": { "id": post_id } } })
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "comments": { "post_id": post_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}