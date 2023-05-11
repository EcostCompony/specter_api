'use strict'

const mongoose = require('mongoose')
const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.create = async (req, res) => {

	try {
		var title = req.query.title
		var short_link = req.query.short_link
		// # 1 - блог
		// # 2 - новости
		var category = req.query.category
		var description = req.query.description

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!title || !short_link) return response.error(4, "one of the required parameters was not passed", [{ "key": 'title', "value": 'required' }, { "key": 'short_link', "value": 'required' }, { "key": 'category', "value": 'optional' }, { "key": 'description', "value": 'optional' }], res)
		if (title.length > 32 || !short_link.match(/^[a-z0-9_.]{3,32}$/i) || category && (!Number.isInteger(category) || category < 1 || category > 2) || description && description.length > 256) {
			let error_details = []
			if (title.length > 32) error_details.push({ "key": 'title', "value": title, "regexp": '/^.{1,32}$/' })
			if (!short_link.match(/^[a-z0-9_.]{3,32}$/i)) error_details.push({ "key": 'short_link', "value": short_link, "regexp": '/^[a-z0-9_.]{3,32}$/i' })
			if (category && (!Number.isInteger(category) || category < 1 || category > 2)) error_details.push({ "key": 'category', "value": category, "regexp": '/^[1-2]$/' })
			if (description && description.length > 256) error_details.push({ "key": 'description', "value": description, "regexp": '/^.{1,256}$/' })
			return response.error(5, "invalid parameter value", error_details, res)
		}
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.error(102, "channel creation error: the short link is already in use", [{ "key": 'short_link', "value": short_link }], res)

		let channelJSON = { "title": title, "short_link": short_link, "subscribers": [{ "_id": req.token_payload.service_id, "admin": 1 }]}
		if (category) channelJSON.category = category
		if (description) channelJSON.description = description

		let channel = new Channel(channelJSON)
		await channel.save()

		return response.send({ "id": channel._id, "title": channel.title, "short_link": channel.short_link, "category": channel.category, "description": channel.description }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.getById = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		var channel = await Channel.findOne({ "_id": channel_id })

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		return response.send({ "id": channel._id, "title": channel.title, "short_link": channel.short_link, "category": channel.category, "description": channel.description }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.get = async (req, res) => {

	try {
		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		let channels = await Channel.find({ "subscribers._id": req.token_payload.service_id }, 'title short_link category description')
		return response.send(channels, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.subscribe = async (req, res) => {

	try {
		var channel_id = req.query.channel_id

		var channel = await Channel.findOne({ "_id": channel_id })
		var user = await User.findOne({ "_id": req.token_payload.service_id }, "-_id name short_link")

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

		if (subscriber.length != 0) return response.error(112, "already signed", [{ "key": 'channel_id', "value": channel_id }], res)

		let subscriberA = { "name": user.name, "short_link": user.short_link }
		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$push": { "subscribers": subscriberA } })

		return response.send(subscriberA, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.search = async (req, res) => {

	try {
		var search_string = req.query.search_string

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!search_string) return response.error(4, "one of the required parameters was not passed", [{ "key": 'search_string', "value": 'required' }], res)

		let channels = await Channel.find({ "$or": [{ "title": { "$regex": `(?i)${search_string}` } }, { "short_link": { "$regex": `(?i)${search_string}` } }] }, 'title short_link category description')

		return response.send(channels, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.editTitle = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var title = req.query.title

		var channel = await Channel.findOne({ "_id": channel_id })
		var user = await User.findOne({ "_id": req.token_payload.service_id })

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !title) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'title', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)
		if (title.length > 32) return response.error(5, "invalid parameter value", [{ "key": 'title', "value": title, "regexp": '/^.{1,32}$/' }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$set": { "title": title } })

		return response.send(await Channel.findOne({ "_id": channel_id }, 'title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.editShortLink = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var short_link = req.query.short_link

		var channel = await Channel.findOne({ "_id": channel_id })
		var user = await User.findOne({ "_id": req.token_payload.service_id })

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !short_link) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'short_link', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)
		if (!short_link.match(/^[a-z0-9_.]{3,32}$/i)) return response.error(5, "invalid parameter value", [{ "key": 'short_link', "value": short_link, "regexp": '/^[a-z0-9_.]{3,32}$/i' }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)
		if (await User.findOne({ "short_link": short_link }) || await Channel.findOne({ "short_link": short_link })) return response.error(102, "channel creation error: the short link is already in use", [{ "key": 'short_link', "value": short_link }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$set": { "short_link": short_link } })

		return response.send(await Channel.findOne({ "_id": channel_id }, 'title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.editCategory = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var category = req.query.category

		var channel = await Channel.findOne({ "_id": channel_id })
		var user = await User.findOne({ "_id": req.token_payload.service_id })

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !category) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'category', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)
		if (category && (!Number.isInteger(category) || category < 1 || category > 2)) return response.error(5, "invalid parameter value", [{ "key": 'category', "value": category, "regexp": '/^[1-2]$/' }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$set": { "category": category } })

		return response.send(await Channel.findOne({ "_id": channel_id }, 'title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.editDescription = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var description = req.query.description

		var channel = await Channel.findOne({ "_id": channel_id })
		var user = await User.findOne({ "_id": req.token_payload.service_id })

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !description) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'description', "value": 'required' }], res)
		if (!channel) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)
		if (description && description.length > 256) return response.error(5, "invalid parameter value", [{ "key": 'description', "value": description, "regexp": '/^.{1,256}$/' }], res)

		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": user._id } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$set": { "description": description } })

		return response.send(await Channel.findOne({ "_id": channel_id }, 'title short_link category description'), res)
	} catch (error) {
		return response.systemError(error, res)
	}

}