'use strict'

const express = require('express')
const app = express()

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

app.set('view engine', 'ejs')

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
