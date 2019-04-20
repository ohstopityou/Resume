'use strict'

const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig.js')

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

app.set('view engine', 'ejs')
app.use(logger('dev'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/editor.html'))
})

app.get('/resume', (req, res) => {
  //res.render('preview') !
  res.sendFile(path.join(__dirname, '/views/resume.html'))
})

app.listen(8080, () => {
  console.log('App listening at http://localhost:8080')
})
