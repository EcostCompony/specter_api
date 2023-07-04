'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var count = !Number(req.query.count) || req.query.count < 1 ? 100000000 : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)
		var id = req.token_payload.service_id

		if (!channel_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		var channelWithSubscribers = await Channel.findOne({ "id": channel_id }, 'subscribers')
		if (!channelWithSubscribers) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		return response.send(channelWithSubscribers.subscribers.slice(offset, count + offset).map(item => ({ "user_id": item.user_id, "is_admin": item.is_admin })), res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var q = req.query.q ? req.query.q.trim() : req.query.q
		var count = !Number(req.query.count) || req.query.count < 1 ? 100000000 : Number(req.query.count)
		var offset = !Number(req.query.offset) || Number(req.query.offset) < 1 ? 0 : Number(req.query.offset)
		var id = req.token_payload.service_id

		if (!channel_id || !q) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'q', "value": 'required' }], res)
		var channelWithSubscribers = await Channel.findOne({ "id": channel_id }, 'subscribers')
		if (!channelWithSubscribers) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		var subscribers = []
		for (let i in channelWithSubscribers.subscribers) {
			let user = await User.findOne({ "id": channelWithSubsriber.subscribers[i].user_id })
			if (user.name.match(new RegExp(q, 'i')) || user.short_link.match(new RegExp(q, 'i'))) {
				channelWithSubscribers.subscribers[i].user = { "id": channelWithSubsriber.subscribers[i].user_id, "name": user.name, "short_link": user.short_link }
				subscribers.push(channelWithSubscribers.subscribers[i])
			}
		}

		return response.send(subscribers.slice(offset, count + offset).map(item => ({ "user": item.user, "is_admin": item.is_admin })), res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}

exports.setAdmin = async (req, res) => {

	try {
		var channel_id = Number(req.query.channel_id)
		var user_id = Number(req.query.user_id)

		if (!channel_id || !user_id) return response.sendDetailedError(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'user_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, 'subscribers')) return response.sendDetailedError(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelWithSubsriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": id }, "subscribers.$")
		if (!channelWithSubsriber || !channelWithSubsriber.subscribers[0].is_admin) return response.sendDetailedError(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		channelWithSubscriber2 = await Channel.findOne({ "id": channel_id, "subscribers.user_id": user_id }, "subscribers.$")
		if (!channelWithSubscriber2) return response.sendDetailedError(50, "not exist", [{ "key": 'user_id', "value": user_id }], res)
		if (channelWithSubscriber2.subscribers[0].is_admin) return response.sendError(600, "the user is already an admin", res)

		await Channel.findOneAndUpdate({ "id": channel_id, "subscribers.user_id": user_id }, { "$set": { "subscribers.$.is_admin": 1 } })

		return response.send(1, res)
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}