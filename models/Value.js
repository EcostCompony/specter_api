const { Schema, model } = require('mongoose')

const Value = new Schema({
	"key": { "type": String, "unique": true, "required": true },
	"value": { "type": String, "required": true }
})

module.exports = model('Value', Value)