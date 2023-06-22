const { Schema, model } = require('mongoose')

const Subscriber = new Schema({
	"user_id": { "type": Number, "required": true },
	"is_admin": { "type": Number, "default": 0, "required": true }
})
const Comment = new Schema({
	"id": { "type": Number, "required": true },
	"author_id": { "type": Number, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})
const Post = new Schema({
	"id": { "type": Number, "required": true },
	"author_id": { "type": String, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true },
	"comments_count": { "type": Number, "default": 0, "required": true },
	"comments": [Comment]
})
const Channel = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"title": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"category": { "type": Number, "required": true },
	"description": String,
	"subscribers_count": { "type": Number, "default": 1, "required": true },
	"posts_count": { "type": Number, "default": 0, "required": true },
	"subscribers": [Subscriber],
	"posts": [Post]
})

module.exports = model('Channel', Channel)