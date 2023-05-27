'use strict'

const response = require('./../response')
const sequenceController = require('./SequenceController')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.create = async (req, res) => {

	try {
		var title = req.query.title
		var short_link = req.query.short_link
		// # 1 - блог
		// # 2 - новости
		var category = Number(req.query.category)
		var description = req.query.description

		if (!title || !short_link) return response.error(6, "invalid request", [{ "key": 'title', "value": 'required' }, { "key": 'short_link', "value": 'required' }, { "key": 'category', "value": 'optional' }, { "key": 'description', "value": 'optional' }], res)
		if (title.length > 32 || !short_link.match(/^[a-z0-9_.]{3,32}$/i) || category && (!Number.isInteger(category) || category < 1 || category > 2) || description && description.length > 256) {
			let error_details = []
			if (title.length > 32) error_details.push({ "key": 'title', "value": title, "regex": '/^.{1,32}$/' })
			if (!short_link.match(/^[a-z0-9_.]{3,32}$/i)) error_details.push({ "key": 'short_link', "value": short_link, "regex": '/^[a-z0-9_.]{3,32}$/i' })
			if (category && (!Number.isInteger(category) || category < 1 || category > 2)) error_details.push({ "key": 'category', "value": category, "regex": '/^[1-2]$/' })
			if (description && description.length > 256) error_details.push({ "key": 'description', "value": description, "regex": '/^.{1,256}$/' })
			return response.error(7, "invalid parameter value", error_details, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.error(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		let channel = new Channel({ "id": await sequenceController.getNextSequence('channels'), "title": title, "short_link": short_link, "subscribers": [{ "user_id": req.token_payload.service_id, "admin": 1 }], "category": category, "description": description})
		await channel.save()

		return response.send({ "id": channel.id, "title": channel.title, "short_link": channel.short_link, "category": channel.category, "description": channel.description }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.getById = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		var channel = await Channel.findOne({ "id": channel_id }, "-_id id title short_link category description")

		if (!channel_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!channel) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)

		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		var optionally = {}
 		optionally.is_subscriber = channelSubscriber ? 1 : 0
		if (channelSubscriber) optionally.is_admin = channelSubscriber.subscribers[0].admin ? 1 : 0

		return response.send(Object.assign(channel._doc, optionally), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		return response.send(await Channel.find({ "subscribers.user_id": req.token_payload.service_id }, '-_id id title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var q = req.query.q

		if (!q) return response.error(6, "invalid request", [{ "key": 'q', "value": 'required' }], res)

		return response.send(await Channel.find({ "$or": [{ "title": { "$regex": `(?i)${q}` } }, { "short_link": { "$regex": `(?i)${q}` } }] }, '-_id id title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.subscribe = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		if (!channel_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		if (await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id})) return response.error(300, "the user is already subscribed", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id }, { "$push": { "subscribers": { "user_id": req.token_payload.service_id } } })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.edit = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var title = req.query.title
		var short_link = req.query.short_link
		var category = req.query.category
		var description = req.query.description

		if (!channel_id || !title && !short_link && !category && !description) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'title', "value": 'required|optional' }, { "key": 'short_link', "value": 'required|optional' }, { "key": 'category', "value": 'required|optional' }, { "key": 'description', "value": 'required|optional' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channel = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channel || !channel.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		if (title && title.length > 32 || short_link && !short_link.match(/^[a-z0-9_.]{3,32}$/i) || category && (!Number.isInteger(category) || category < 1 || category > 2) || description && description.length > 256) {
			let error_details = []
			if (title && title.length > 32) error_details.push({ "key": 'title', "value": title, "regex": '/^.{1,32}$/' })
			if (short_link && !short_link.match(/^[a-z0-9_.]{3,32}$/i)) error_details.push({ "key": 'short_link', "value": short_link, "regex": '/^[a-z0-9_.]{3,32}$/i' })
			if (category && (!Number.isInteger(category) || category < 1 || category > 2)) error_details.push({ "key": 'category', "value": category, "regex": '/^[1-2]$/' })
			if (description && description.length > 256) error_details.push({ "key": 'description', "value": description, "regex": '/^.{1,256}$/' })
			return response.error(7, "invalid parameter value", error_details, res)
		}
		if (short_link && (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link }))) return response.error(51, "already in use", [{ "key": 'short_link', "value": short_link }], res)

		if (title) await Channel.findOneAndUpdate({ "id": channel_id }, { "title": title })
		if (short_link) await Channel.findOneAndUpdate({ "id": channel_id }, { "short_link": short_link })
		if (category) await Channel.findOneAndUpdate({ "id": channel_id }, { "category": category })
		if (description) await Channel.findOneAndUpdate({ "id": channel_id }, { "description": description })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.delete = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		if (!channel_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id })) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channel = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channel || !channel.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndRemove({ "id": channel_id })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}