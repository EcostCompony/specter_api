const { Schema, model } = require('mongoose')

const Subscriber = new Schema({
	"user_id": { "type": Number, "unique": true, "required": true },
	"admin": Boolean
})
const Comment = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"author_id": { "type": Number, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})
const Post = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"author": { "type": String, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true },
	"comments": [Comment],
	"comments_count": { "type": Number, "default": 0, "required": true }
})
const Channel = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"title": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"category": Number,
	"description": String,
	"subscribers": [Subscriber],
	"posts": [Post],
	"posts_count": { "type": Number, "default": 0, "required": true }
})

module.exports = model('Channel', Channel)