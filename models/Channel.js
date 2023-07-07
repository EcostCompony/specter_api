const { Schema, model, mongoose } = require('mongoose')

const Subscriber = new Schema({
	"user": { "type": mongoose.Schema.Types.ObjectId, "ref": 'User', "required": true },
	"is_admin": { "type": Number, "default": 0, "required": true }
})

const Comment = new Schema({
	"id": { "type": Number, "required": true },
	"post_id": { "type": Number, "required": true },
	"author": { "type": mongoose.Schema.Types.ObjectId, "ref": 'User', "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})

const Post = new Schema({
	"id": { "type": Number, "required": true },
	"author": {
		"id": { "type": Number, "required": true },
		"name": { "type": String, "required": true }
	},
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})

const Channel = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"title": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"category": { "type": Number, "required": true },
	"description": String,
	"subscribers_count": { "type": Number, "default": 1, "required": true },
	"posts_count": { "type": Number, "default": 0, "required": true },
	"comments_count": { "type": Number, "default": 0, "required": true },
	"subscribers": [Subscriber],
	"posts": [Post],
	"comments": [Comment]
})

var autoPopulate = function(next) {
	this.populate('subscribers.user', "-_id id name short_link")
	this.populate('comments.author', "-_id id name short_link")
	next()
}

Channel.pre('findOne', autoPopulate).pre('find', autoPopulate)

module.exports = model('Channel', Channel)