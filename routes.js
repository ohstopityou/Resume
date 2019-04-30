'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })
const jsonParser = require('body-parser').json()

const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig.js')

// Redirects to login screen if no active session
const requireLogin = (req, res, next) => {
  if (!req.session.populated) {
    res.render('login')
  } else {
    next()
  }
}

// Redirects to editor if logged in
router.get('/', requireLogin, (req, res) => {
  res.redirect('/editor')
})

router.route('/signup')
  .post(formParser, async (req, res) => {
    let db
    try {
      db = await mysql.createConnection(sqlConfig)
      let result = await db.execute(`
      SELECT resume
      FROM users
      WHERE email = '${req.body.email}'`)
      let resume = result[0][0]
      if (!resume) {
        // Resume does not exist, creating new resume
        let result = await db.execute(`
        INSERT INTO resumes ()
        VALUES ();`)

        // Save resume to session
        let resumeid = result[0]['insertId']
        req.session.resumeid = resumeid

        await db.execute(`
        INSERT INTO experiences (resume)
        VALUES (${resumeid});`)

        await db.execute(`
        INSERT INTO education (resume)
        VALUES (${resumeid});`)
      

        // Create new user for resume
        await db.execute(`
        INSERT INTO users (email, password, resume)
        VALUES ('${req.body.email}', '${req.body.password}', ${resumeid});`)

        res.redirect('editor')

      } else {
        throw Error('User already exists')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('login', { error: err })
    } finally {
      // Close connection
      if (db) { db.end() }
    }
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
        console.log('Logged in successfully')
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

    // Add experience if exists
    let experience
    try {
      experience = await db.execute(`
      SELECT * FROM experiences
      WHERE resume = ${resumeid}`)
      experience = experience[0][0]
    } catch {
      experience = ''
    }

    // Add education if exists
    let education
    try {
      education = await db.execute(`
      SELECT * FROM education
      WHERE resume = ${resumeid}`)
      education = education[0][0]
    } catch {
      education = ''
    }

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
  req.session = null
  res.redirect('login')
})

router.route('/resume')
  .get(requireLogin, async (req, res) => {
    let db
    const resumeid = req.session.resumeid
    try {
      db = await mysql.createConnection(sqlConfig)
      let resume = await db.execute(`
      SELECT * FROM users
      INNER JOIN resumes ON users.resume = resumes.id
      WHERE resumes.id = ${resumeid}`)
      resume = resume[0][0]
  
      // Add experience if exists
      let experience
      try {
        experience = await db.execute(`
        SELECT * FROM experiences
        WHERE resume = ${resumeid}`)
        experience = experience[0][0]
      } catch {
        experience = ''
      }
  
      // Add education if exists
      let education
      try {
        education = await db.execute(`
        SELECT * FROM education
        WHERE resume = ${resumeid}`)
        education = education[0][0]
      } catch {
        education = ''
      }

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
  .put(requireLogin, jsonParser, async (req, res) => {
    let db
    let r = req.body
    r.phone = r.phone || 0;
    r.postcode = r.postcode || 0;

    try {
      db = await mysql.createConnection(sqlConfig)
      // Inner join
      await db.execute(`
      UPDATE resumes
      LEFT JOIN experiences ON experiences.resume = resumes.id
      LEFT JOIN education ON education.resume = resumes.id
      SET 
      resumes.name = '${r.name}',
      resumes.summary = '${r.summary}',
      resumes.worktitle = '${r.title}',
      resumes.phone = ${r.phone},
      resumes.address = '${r.address}',
      resumes.city = '${r.city}',
      resumes.postcode = ${r.postcode},
      education.title = '${r['edu-title']}',
      education.location = '${r['edu-location']}',
      education.from = '${r['edu-from']}',
      education.to = '${r['edu-to']}',
      education.summary = '${r['edu-summary']}',
      experiences.title = '${r['exp-title']}',
      experiences.location = '${r['exp-location']}',
      experiences.from = '${r['exp-from']}',
      experiences.to = '${r['exp-to']}',
      experiences.summary = '${r['exp-summary']}'
      WHERE resumes.id = ${req.session.resumeid}`)
    } catch (err) {
      console.log('Some Error: ' + err)
      // Not found, redirect to login
      res.send('Update not OK')
    } finally {
      // Close connection
      if (db) { db.end() }
      res.send('Update OK')
    }
  })

router.all('*', (req, res) => {
  res.redirect('/')
})

module.exports = router
