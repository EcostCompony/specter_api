'use strict'

const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		if (!channel_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }], res)
		let channel = await Channel.findOne({ "id": channel_id }, 'subscribers')
		if (!channel) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		for (let i in channel.subscribers) {
			let user = await User.findOne({ "id": channel.subscribers[i].user_id })
			channel.subscribers[i].name = user.name
			channel.subscribers[i].short_link = user.short_link
		}

		return response.send(channel.subscribers.map(item => ({ "user_id": item.user_id, "name": item.name, "short_link": item.short_link, "admin": item.admin })), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var q = req.query.q

		if (!channel_id || !q) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'q', "value": 'required' }], res)
		let channel = await Channel.findOne({ "id": channel_id }, 'subscribers')
		if (!channel) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id}, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)

		var subscribers = []
		for (let i in channel.subscribers) {
			let user = await User.findOne({ "id": channel.subscribers[i].user_id })
			channel.subscribers[i].name = user.name
			channel.subscribers[i].short_link = user.short_link
			if (user.name.match(new RegExp(q, 'i')) || user.short_link.match(new RegExp(q, 'i'))) subscribers.push(channel.subscribers[i])
		}

		return response.send(subscribers.map(item => ({ "user_id": item.user_id, "name": item.name, "short_link": item.short_link, "admin": item.admin })), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.setAdmin = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var user_id = req.query.user_id

		if (!channel_id || !user_id) return response.error(6, "invalid request", [{ "key": 'channel_id', "value": 'required' }, { "key": 'user_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "id": channel_id }, 'id')) return response.error(50, "not exist", [{ "key": 'channel_id', "value": channel_id }], res)
		let channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": req.token_payload.service_id }, "subscribers.$")
		if (!channelSubscriber || !channelSubscriber.subscribers[0].admin) return response.error(8, "access denied", [{ "key": 'channel_id', "value": channel_id }], res)
		channelSubscriber = await Channel.findOne({ "id": channel_id, "subscribers.user_id": user_id }, "subscribers.$")
		if (!channelSubscriber) return response.error(50, "not exist", [{ "key": 'user_id', "value": user_id }], res)
		if (channelSubscriber.subscribers[0].admin) return response.error(600, "the user is already an admin", [{ "key": 'user_id', "value": user_id }], res)

		await Channel.findOneAndUpdate({ "id": channel_id, "subscribers.id": user_id }, { "$set": { "subscribers.$.admin": true } })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}