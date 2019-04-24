'use strict'

const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig.js')

const PORT = process.env.PORT || 8080

// Makes files in public folder accessable
const path = require('path')
const publicFolder = path.join(__dirname, '/public')
app.use(express.static(publicFolder))

app.set('view engine', 'ejs')
app.use(logger('dev'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.render('editor', { resume: '', edu: '', exp: '', id: 0 })
})

app.route('/login')
  .get((req, res) => {
    res.render('error', { error: 'Login not created yet' })
  })
  .post((req, res) => {
    const username = req.body.username
    const password = req.body.password

    // Any username and password lets you in ;)
    if (username && password) {
      res.sendFile(path.join(__dirname, '/views/editor.html'))
    }
  })

app.route('/editor/:id')
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

      if (resume) {
        res.render('editor', { resume: resume, edu: education, exp: experience, id: req.params.id })
      } else {
        throw Error('Resume not found')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('error', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }
  })

app.route('/resume/:id')
  .get(async (req, res, next) => {
    let db
    try {
      console.log('Connecting to DB')
      db = await mysql.createConnection(sqlConfig)
      console.log('DB connected')
      let resume = await db.execute(`
      SELECT * FROM users
      INNER JOIN resumes ON users.resume = resumes.id
      WHERE resumes.id = ${req.params.id}`)
      resume = resume[0][0]
      console.log('resume found')

      let experience = await db.execute(`
      SELECT * FROM experiences
      WHERE resume = ${req.params.id}`)
      experience = experience[0][0]
      console.log('experience found')

      let education = await db.execute(`
      SELECT * FROM education
      WHERE resume = ${req.params.id}`)
      education = education[0][0]

      if (resume) {
        res.render('resume', { resume: resume, edu: education, exp: experience })
      } else {
        throw Error('Resume not found')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('error', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }
  })
  .post((req, res) => {
    // Creates a new resume
  })
  .put(async (req, res) => {
    let db
    let r = req.body

    try {
      db = await mysql.createConnection(sqlConfig)
      // Inner join
      let result = await db.execute(`
      UPDATE resumes
      SET 
      name = '${r.name}',
      summary = '${r.summary}',
      worktitle = '${r.title}',
      phone = ${r.phone},
      address = '${r.address}',
      city = '${r.city}',
      postcode = ${r.postcode}
      WHERE id = ${req.params.id}`)
    } catch (err) {
      console.log('Some Error: ' + err)
      // Not found, redirect to login
      res.sendFile(path.join(__dirname, '/views/login.html'))
    } finally {
      // Close connection
      if (db) { db.end() }
      res.send('Update OK')
    }
  })
  .delete((req, res) => {
    // Delete a resume
  })

app.listen(PORT, () => {
  console.log('App listening at http://localhost:8080')
})
