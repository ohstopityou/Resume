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
  res.sendFile(path.join(__dirname, '/views/resume.html'))
})

app.get('/resumeejs', (req, res) => {
  res.render('resume', { name: 'Thomas Søvik' })
})

app.route('/login')
  .get((req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'))
  })
  .post((req, res) => {
    const username = req.body.username
    const password = req.body.password

    // Any username and password lets you in ;)
    if (username && password) {
      res.sendFile(path.join(__dirname, '/views/editor.html'))
    }
  })

app.route('/resume/:id')
  .get(async (req, res, next) => {
    // connect to db
    // get resume where id = req.params.id
    let db
    try {
      db = await mysql.createConnection(sqlConfig)
      const [sum, fields] = await db.execute(`INSERT INTO fbcritics (name) VALUES ('${name}')`)
      const sumAsString = sum.pop().value.toString()
      res.send(sumAsString)
    } catch (err) {
      // Forward to error handler
      next(err)
    } finally {
      // Close connection
      if (db) { db.end() }
    }
    // res.render('resume', dbresult)
    res.render('resume')
  })
  .post((req, res) => {
    // Creates a new resume
  })
  .put((req, res) => {
    // Update a resume
  })
  .delete((req, res) => {
    // Delete a resume
  })

app.listen(8080, () => {
  console.log('App listening at http://localhost:8080')
})
