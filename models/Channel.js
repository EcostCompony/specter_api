const { Schema, model } = require('mongoose')
const Post = require('./Post')

const Subscriber = new Schema({ "admin": Boolean })
const Channel = new Schema({
	"title": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"category": Number,
	"description": String,
	"subscribers": [Subscriber],
	"posts": [Post]
})

module.exports = model('Channel', Channel)