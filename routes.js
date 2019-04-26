'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })

const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig.js')

function verify (req) {
  return req.session && req.session.id
}

// Redirects to welcome screen if not logged in
const sessionChecker = (req, res, next) => {
  if (verify(req)) {
    next()
  } else {
    res.redirect('/login')
  }
}

// Redirects to editor if logged in
router.get('/', sessionChecker, (req, res) => {
  res.redirect('/editor')
})

router.route('/login')
  .get((req, res) => {
    // Redirect to editor if logged in, else render login screen
    verify(req) ? res.redirect('editor') : res.render('welcome')
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
        console.log('session')
        req.session.resumeid = 1
        
        console.log(req.session.resumeid)
        res.redirect(`/editor/${resumeid}`)
      } else {
        throw Error('Wrong username or password')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('welcome', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }

    // if (req.body.name === 'admin') {
    //   req.session.name = 'admin'
    //   res.redirect('/editor/1')
    // } else {
    //   res.render('welcome', { error: 'wrong username or password' })
    // }
  })

router.get('/editor', (req, res) => {
  res.redirect('/editor/1')
})

router.route('/editor/:id')
  .get(sessionChecker, async (req, res, next) => {
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
      res.render('welcome', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }
  })

router.get('/logout', (req, res) => {
  console.log(req.cookies)
  console.log(req.cookies.user_sid)
  console.log(req.session)
  res.clearCookie('user_sid')
  //res.redirect('/')
  res.end()
})

router.route('/resume/:id')
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

router.all('*', (req, res) => {
  res.redirect('/')
})

module.exports = router
