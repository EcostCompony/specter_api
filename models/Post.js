const { Schema, model } = require('mongoose')

const Post = new Schema({
	"author": { "type": String, "required": true },
	"text": { "type": String, "required": true },
	"datetime": { "type": Number, "required": true }
})

module.exports = Post