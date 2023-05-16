'use strict'

const response = require('./../response')
const Channel = require('./../models/Channel')

exports.create = async (req, res) => {

	const User = require('./../models/User')

	try {
		var channel_id = req.query.channel_id
		// # 1 - канал
		// # 2 - пользователь
		var author = req.query.author
		var text = req.query.text

		if (!channel_id || !author || !text) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'author', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		var channel = await Channel.findOne({ "id": channel_id }, "-_id title posts_count")
		if (!channel) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (text.trim() == '' || !Number.isInteger(Number(author)) || Number(author) < 1 || Number(author) > 2) {
			let error_details = []
			if (text.trim() == '') error_details.push({ "key": 'text', "value": text, "regex": '/./' })
			if (!Number.isInteger(Number(author)) || Number(author) < 1 || Number(author) > 2) error_details.push({ "key": 'author', "value": author, "regex": '/^[1-2]$/' })
			return response.error(7, "invalid parameter value", error_details, res)
		}

		await Channel.findOneAndUpdate({ "id": channel_id }, { "posts_count": channel.posts_count + 1 })

		let post = { "id": channel.posts_count + 1, "author": author == 1 ? channel.title : await User.findOne({ "_id": req.token_payload.service_id }).name, "text": text, "datetime": Date.now() }
		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "posts": post } })

		return response.send(post, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		if (!channel_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		let channel = await Channel.findOne({ "id": channel_id }, 'posts')
		if (!channel) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		return response.send(channel.posts.map((item) => ({ "id": item.id, "author": item.author, "text": item.text, "datetime": item.datetime })), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id
		var text = req.query.text

		if (!channel_id || !post_id || !text) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)
		if (text.trim() == '') return response.error(7, "invalid parameter value", [{ "key": 'text', "value": text, "regex": '/./' }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "posts.id": post_id }, { "$set": { "posts.$.text": text} })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id

		if (!channel_id || !post_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, '_id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		var channelPost = await Channel.findOne({ "id": channel_id, "posts.id": post_id }, 'posts')
		if (!channelPost) return response.error(50, "not exist", [{ "key": 'post_id', "value": post_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$pull": { "posts": { "id": post_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}