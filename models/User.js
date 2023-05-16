const { Schema, model } = require('mongoose')

const User = new Schema({
	"id": { "type": Number, "unique": true, "required": true },
	"name": { "type": String, "required": true },
	"short_link": { "type": String, "unique": true, "required": true },
	"ecost_id": { "type": Number, "unique": true, "required": true }
})

module.exports = model('User', User)