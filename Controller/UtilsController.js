'use strict'

exports.getAndroidAppMinimumSupportedVersionCode = async (req, res) => {

	const response = require('./../response')
	const Value = require('./../models/Value')

	try {
		return response.send({ "value": (await Value.findOne({ "key": 'ANDROID_APP_MINIMUM_SUPPORTED_VERSION_CODE' })).value }, res)
	} catch (error) {
		return response.systemError(error, res)
	}

}