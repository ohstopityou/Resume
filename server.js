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
    let db
    try {
      db = await mysql.createConnection(sqlConfig)
      let resume = await db.execute(`
      SELECT * FROM users
      INNER JOIN resumes ON users.resume = resumes.id
      WHERE resumes.id = ${req.params.id}`)
      resume = resume[0][0]

      let experience = await db.execute(`
      SELECT * FROM experiences
      WHERE resume = ${req.params.id}`)
      experience = experience[0][0]

      let education = await db.execute(`
      SELECT * FROM education
      WHERE resume = ${req.params.id}`)
      education = education[0][0]
      console.log(education.from.toDateString())

      if (resume) {
        res.render('resume', { resume: resume, edu: education, exp: experience })
      } else {
        throw Error('Resume not found')
      }
    } catch (err) {
      // Not found, redirect to login
      res.sendFile(path.join(__dirname, '/views/login.html'))
    } finally {
      // Close connection
      if (db) { db.end() }
    }
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
