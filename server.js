const app = require('express')()
const config = require('./config')

const PORT = process.env.PORT || config.PORT

require('./middleware/passport')(require('passport'))
require('./settings/routes')(app)

const start = async () => {

	try {
		await require('mongoose').connect(config.MONGODB_URI)
		app.listen(PORT, () => console.log(`App listen on port ${PORT}`))
	} catch (error) {
		console.log(error)
	}

}
start()