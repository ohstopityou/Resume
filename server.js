'use strict'

const express = require('express')
const session = require('cookie-session')

// TODO: uninstall express-session cookie-parser, npm install --save cookie-session

const app = express()
const logger = require('morgan')
const routes = require('./routes')

const PORT = process.env.PORT || 8080

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

app.set('view engine', 'ejs')
app.use(logger('dev'))
app.use(session({ name: 'session', keys: ['username', 'resumeid'] }))

app.use('/', routes)

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`)
})
