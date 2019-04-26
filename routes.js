'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })

const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig.js')

// Redirects to login screen if no active session
const requireLogin = (req, res, next) => {
  if (!req.session.populated)) {
    res.render('login')
  } else {
    next()
  }
}

// Redirects to editor if logged in
router.get('/', requireLogin, (req, res) => {
  res.redirect('/editor')
})

router.route('/login')
  .get(requireLogin, (req, res) => {
    // Redirect to editor if logged in, else render login screen
    res.redirect('editor')
  })
  .post(formParser, async (req, res) => {
    let db
    try {
      db = await mysql.createConnection(sqlConfig)
      const result = await db.execute(`
      SELECT resume 
      FROM users
      WHERE email = '${req.body.email}' AND password = '${req.body.password}'`)
      const resumeid = result[0][0]['resume']
      if (resumeid) {
        req.session.resumeid = resumeid
        res.redirect(`/editor`)
      } else {
        throw Error('Wrong username or password')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('login', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }
  })

router.get('/editor', requireLogin, async (req, res) => {
  let db
  const resumeid = req.session.resumeid
  try {
    db = await mysql.createConnection(sqlConfig)
    let resume = await db.execute(`
    SELECT * FROM users
    INNER JOIN resumes ON users.resume = resumes.id
    WHERE resumes.id = ${resumeid}`)
    resume = resume[0][0]

    let experience = await db.execute(`
    SELECT * FROM experiences
    WHERE resume = ${req.params.id}`)
    experience = experience[0][0]

    let education = await db.execute(`
    SELECT * FROM education
    WHERE resume = ${resumeid}`)
    education = education[0][0]

    if (resume) {
      res.render('editor', { resume: resume, edu: education, exp: experience, id: resumeid })
    } else {
      throw Error('Resume not found')
    }
  } catch (err) {
    // Not found, redirect to login
    res.render('login', { error: err })
  } finally {
    // Close connection
    if (db) { db.end() }
  }
})

router.get('/logout', (req, res) => {
  const name = req.session.username
  req.session = null
  res.render('login', {error: `Goodybye ${name}`})
})

// TODO : Anyone can view any resume as long as they are logged in?
router.route('/resume/:id')
  .get(requireLogin, async (req, res) => {
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
      console.log('resume rendering error')
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
  .put(requireLogin, async (req, res) => {
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

router.all('*', (req, res) => {
  res.redirect('/')
})

module.exports = router
