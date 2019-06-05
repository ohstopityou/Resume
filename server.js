'use strict'

const express = require('express')
const app = express()
const routes = require('./routes')
const session = require('cookie-session')

// Logger used during development
const logger = require('morgan')
app.use(logger('dev'))

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

// Enable template engine ejs
app.set('view engine', 'ejs')

// Saves session data to the cookie sent with the clients.
app.use(session({ name: 'session', secret: 'supersecret' }))

// Use routes from seperate file. --Needs to last--
app.use('/', routes)

// Set port to cloud default or 8080, then start server.
const PORT = process.env.PORT || 8080
app.listen(PORT, () => { console.log(`App listening at http://localhost:${PORT}`) })
