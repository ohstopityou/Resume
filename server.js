'use strict'

const express = require('express')
const app = express()

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.send('<h1>Hello</h1>')
})

app.get('/pre', (req, res) => {
  res.render('preview')
})

app.listen(8080, () => {
  console.log('App listening at http://localhost:8080')
})
