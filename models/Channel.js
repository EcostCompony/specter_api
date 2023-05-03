const { Schema, model } = require('mongoose')

const Subscriber = new Schema({ "admin": Boolean })
const Post = new Schema({
	"author": { "type": String, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})
const Channel = new Schema({
	"title": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"category": Number,
	"description": String,
	"subscribers": [Subscriber],
	"posts": [Post]
})

module.exports = model('Channel', Channel)