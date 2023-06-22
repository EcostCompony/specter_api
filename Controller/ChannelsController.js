'use strict'

const response = require('./../response')
const sequenceController = require('./SequenceController')
const Channel = require('./../models/Channel')
const User = require('./../models/User')

exports.create = async (req, res) => {

	try {
		var title = req.query.title.trim()
		var short_link = req.query.short_link.trim()
		var category = Number(req.query.category)
		var description = req.query.description.trim()

		if (!title || !short_link) return response.sendDetailedError(6, "invalid request", [{ "key": 'title', "value": 'required' }, { "key": 'short_link', "value": 'required' }, { "key": 'category', "value": 'optional' }, { "key": 'description', "value": 'optional' }], res)
		if (title.length > 64 || !short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4 || category && (category < 0 || category > 2) || description && description.length > 256) {
			let error_details = []
			if (title.length > 64) error_details.push({ "key": 'title', "value": title })
			if (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) error_details.push({ "key": 'short_link', "value": short_link })
			if (category && (category < 0 || category > 2)) error_details.push({ "key": 'category', "value": category })
			if (description && description.length > 256) error_details.push({ "key": 'description', "value": description })
			return response.sendDetailedError(7, "invalid parameter value", error_details, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.sendError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		let channel = new Channel({ "id": await sequenceController.getNextSequence('channels'), "title": title, "short_link": short_link, "category": category ? category : 0, "description": description ? description : null, "subscribers": [{ "user_id": req.token_payload.service_id, "is_admin": 1 }] })
		await channel.save()

		let channelResponse = {
			"id": channel.id,
			"title": channel.title,
			"short_link": channel.short_link,
			"body": '%CHANNEL_CREATED%',
			"is_subscriber": 1,
			"is_admin": 1,
			"category": channel.category,
			"subscribers_count": channel.subscribers_count
		}
		if (description) channelResponse.description = description

		return response.send(channelResponse, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.getById = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var id = req.token_payload.service_id

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)

		var channel = await Channel.findOne({ "id": channel_id }, "-_id id title short_link category description subscribers_count")
		if (!channel) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		let channelWithPosts = await Channel.findOne({ "id": channel_id }, "posts")
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")

		channel._doc.body = channelWithPosts.posts.length == 0 ? '%CHANNEL_CREATED%' : channelWithPosts.posts[channelWithPosts.posts.length - 1].text
		channel._doc.is_subscriber = channelWithSubsriber ? 1 : 0
		if (channel._doc.is_subscriber) channel._doc.is_admin = channelWithSubsriber.subscribers[0].is_admin
		if (!channel.description) delete channel._doc.description

		return response.send(channel, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		var id = req.token_payload.service_id

		var channels = await Channel.find({ "subscribers.user_id": id }, '-_id id title short_link category description subscribers_count')

		for (let i in channels) {
			let channelWithPosts = await Channel.findOne({ "id": channels[i].id }, "posts")
			let channelWithSubsriber = await Channel.findOne({ "id": channels[i].id, "subscribers.user_id": id }, "subscribers.$")

			channels[i]._doc.body = channelWithPosts.posts.length == 0 ? '%CHANNEL_CREATED%' : channelWithPosts.posts[channelWithPosts.posts.length - 1].text
			channels[i]._doc.is_subscriber = 1
			channels[i]._doc.is_admin = channelWithSubsriber.subscribers[0].is_admin
			if (!channels[i]._doc.description) delete channels[i]._doc.description
		}

		return response.send(channels, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var q = req.query.q.trim()
		var id = req.token_payload.service_id

		if (!q) return response.sendDetailedError(6, "invalid request", [{ "key": 'q', "value": 'required' }], res)

		var channels = await Channel.find({ "$or": [{ "title": { "$regex": `(?i)${q}` } }, { "short_link": { "$regex": `(?i)${q}` } }] }, '-_id id title short_link category description subscribers_count')

		for (let i in channels) {
			let channelWithPosts = await Channel.findOne({ "id": channels[i].id }, "posts")
			let channelWithSubsriber = await Channel.findOne({ "id": channels[i].id, "subscribers.user_id": id }, "subscribers.$")

			channels[i]._doc.body = channelWithPosts.posts.length == 0 ? '%CHANNEL_CREATED%' : channelWithPosts.posts[channelWithPosts.posts.length - 1].text
			channels[i]._doc.is_subscriber = channelWithSubsriber ? 1 : 0
			if (channels[i]._doc.is_subscriber) channels[i]._doc.is_admin = channelWithSubsriber.subscribers[0].is_admin
			if (!channels[i]._doc.description) delete channels[i]._doc.description
		}

		return response.send(channels, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.subscribe = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var id = req.token_payload.service_id

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (await Channel.findOne({ "id": channel_id, "subscribers.user_id": id })) return response.sendError(300, "the user is already subscribed", res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "subscriber_numbers": 1 }, "$push": { "subscribers": { "user_id": req.token_payload.service_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.unsubscribe = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var id = req.token_payload.service_id

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!await Channel.findOne({ "id": channel_id, "subscribers.user_id": id })) return response.sendError(301, "the user is not subscribed", res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$inc": { "subscriber_numbers": -1 }, "$pull": { "subscribers": { "user_id": req.token_payload.service_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var title = req.query.title.trim()
		var short_link = req.query.short_link.trim()
		var category = Number(req.query.category)
		var description = req.query.description.trim()
		var id = req.token_payload.service_id

		if (!channel_id || !title && !short_link && !category && category !== 0 && !description) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'title', "value": 'optional*' }, { "key": 'short_link', "value": 'optional*' }, { "key": 'category', "value": 'optional*' }, { "key": 'description', "value": 'optional*' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (title && title.length > 64 || short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4) || category && (category < 0 || category > 2) || description && description.length > 256) {
			let error_details = []
			if (title && title.length > 64) error_details.push({ "key": 'title', "value": title })
			if (short_link && (!short_link.match(/^[a-z][a-z\d\_\.]{2,30}[a-z\d]$/) || short_link.replaceAll(/[a-z\d]/g, '').length / short_link.length > 0.4)) error_details.push({ "key": 'short_link', "value": short_link })
			if (category && (category < 0 || category > 2)) error_details.push({ "key": 'category', "value": category })
			if (description && description.length > 256) error_details.push({ "key": 'description', "value": description })
			return response.sendDetailedError(7, "invalid parameter value", error_details, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.sendDetailedError(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		if (title) await Channel.findOneAndUpdate({ "id": channel_id }, { "title": title })
		if (short_link) await Channel.findOneAndUpdate({ "id": channel_id }, { "short_link": short_link })
		if (category) await Channel.findOneAndUpdate({ "id": channel_id }, { "category": category })
		if (description) await Channel.findOneAndUpdate({ "id": channel_id }, { "description": description == "" ? null : description })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var id = req.token_payload.service_id

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndRemove({ "id": channel_id })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}