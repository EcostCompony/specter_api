'use strict'

const mongoose = require('mongoose')
const response = require('./../response')
const User = require('./../models/User')
const Channel = require('./../models/Channel')

exports.editPost = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id
		var text = req.query.text

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !post_id || !text) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }, { "key": 'text', "value": 'required' }], res)
		if (!await Channel.findOne({ "_id": channel_id })) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		let post = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$posts' }, { "$match": { "posts._id": new mongoose.Types.ObjectId(post_id) } }, { "$project": { "post": "$posts" } }])
		if (post[0]) post = post[0].post
		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": new mongoose.Types.ObjectId(req.token_payload.service_id) } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)
		if (post.length == 0) return response.error(110, "not found", [{ "key": 'post_id', "value": post_id }], res)
		if (text.trim() == '') return response.error(5, "invalid parameter value", [{ "key": 'text', "value": text, "regexp": '/./' }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id, "posts._id": post_id }, { "$set": { "posts.$.text": text} })

		return response.send({ "author": post.author, "text": text, "datetime": post.datetime }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}

exports.deletePost = async (req, res) => {

	try {
		var channel_id = req.query.channel_id
		var post_id = req.query.post_id

		if (req.token_payload.type != 'access' || req.token_payload.service != 'specter') {
			let error_details = []
			if (req.token_payload.type != 'access') error_details.push({ "key": 'type', "value": req.token_payload.type, "required": 'access' })
			if (req.token_payload.service != 'specter') error_details.push({ "key": 'service', "value": req.token_payload.service, "required": 'specter' })
			return response.error(3, "invalid access token", error_details, res)
		}
		if (!channel_id || !post_id) return response.error(4, "one of the required parameters was not passed", [{ "key": 'channel_id', "value": 'required' }, { "key": 'post_id', "value": 'required' }], res)
		if (!await Channel.findOne({ "_id": channel_id })) return response.error(110, "not found", [{ "key": 'channel_id', "value": channel_id }], res)

		let post = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$posts' }, { "$match": { "posts._id": new mongoose.Types.ObjectId(post_id) } }, { "$project": { "post": "$posts" } }])
		if (post[0]) post = post[0].post
		let subscriber = await Channel.aggregate([{ "$match": { "_id": new mongoose.Types.ObjectId(channel_id) } }, { "$unwind": '$subscribers' }, { "$match": { "subscribers._id": new mongoose.Types.ObjectId(req.token_payload.service_id) } }, { "$project": { "subscriber": "$subscribers" } }])
		if (subscriber[0]) subscriber = subscriber[0].subscriber

		if (subscriber.length == 0 || !subscriber.admin) return response.error(111, "no access", [{ "key": 'channel_id', "value": channel_id }], res)
		if (post.length == 0) return response.error(110, "not found", [{ "key": 'post_id', "value": post_id }], res)

		await Channel.findOneAndUpdate({ "_id": channel_id }, { "$pull": { "posts": { "_id": post_id } } });

		return response.send({ "author": post.author, "text": post.text, "datetime": post.datetime }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}