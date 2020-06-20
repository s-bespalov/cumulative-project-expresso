const express = require('express')
const app = express()

const port = process.env.PORT || 4000

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const errorHandler = require('errorhandler')
app.use(errorHandler())

const cors = require('cors')
app.use(cors())

const morgan = require('morgan')
app.use(morgan('dev'))

const apiRouter = require('./api/api')
app.use('/api', apiRouter)

app.listen(port)

module.exports = app
