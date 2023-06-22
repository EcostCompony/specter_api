'use strict'


exports.getNextSequence = async (table, res) => {

	const response = require('./../response')
	const Sequence = require('./../models/Sequence')

	try {
		return (await Sequence.findOneAndUpdate({ "table": table }, { "$inc": { "count": 1 } })).count
	} catch (error) {
		return response.sendSystemError(error, res)
	}

}