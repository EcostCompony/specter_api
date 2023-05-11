'use strict'

const mongoose = require('mongoose')
const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.get = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		let channel = await Channel.findOne({ "_id": channel_id }, 'subscribers')

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		return response.send(channel.subscribers, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var search_string = req.query.search_string

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !search_string) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'search_string', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscribers = await Channel.find({ "$or": [{ "subscribers.name": { "$regex": `(?i)${search_string}` } }, { "subscribers.short_link": { "$regex": `(?i)${search_string}` } }] }, 'name short_link admin')

		return response.send(subscribers, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.addAdmin = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var user_id = req.query.user_id

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !user_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'user_id', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user_id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0) return response.error(1453, "undefined", [{ "key": 'user_id', "value": user_id }], res)
		if (subscriber.admin) return response.error(1433, "already admin", [{ "key": 'user_id', "value": user_id }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id, "subscribers._id": user_id }, { "$set": { "subscribers.$.admin": true } })

		return response.send(1, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}