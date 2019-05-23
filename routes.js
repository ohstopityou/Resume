'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })
const jsonParser = require('body-parser').json()

// Connect to database
const database = require('./database')
const db = new database()
db.connect()

// Checks if session exists, else redirects to login
const requireLogin = (req, res, next) => {
  req.session.populated ? next() : res.render('login')
}

// Ignores requests to favicon
router.get('/favicon.ico', (req, res) => res.sendStatus(204))

// Redirects to editor if logged in
router.get('/', requireLogin, (req, res) => {
  res.redirect('/login')
})


router.get('/error', async (req, res, next) => {
  
  //throw Error('User already exists')
  next('Errrrrrr')

})

router.get('/test', async (req, res) => {
  
  let tst = await db.getExperiences(1)
  //let tst = await db.loginUser('a', 'b')
  //let exists = await db.userExists('test@uib.no')
  //let userid = await db.newUser('testbro', 'dude')
  //let resumeid = await db.newResume(userid)
  if(exists) {
    // Try to log in
  } else {
    // Create new user
  }
  res.end()
})

// Handles signup requests
router.post('/signup', formParser, async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  if ( !email || !password ) {
    next('Missing username or password')
  }
  
  const user = await db.getUser(email)
  if (user.length) {
    next('User already exists')
  }

  // Create new user, save to session
  const userid = await db.newUser(email, password)
  req.session.user = userid

  // Create new resume, save to session
  const resumeid = await db.newResume(userid)
  req.session.resume = resumeid

  res.redirect('editor')
})

router.route('/login')
  .get(requireLogin, (req, res) => {
    res.redirect('editor')
  })
  .post(formParser, async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    if ( !email || !password ) {
      next('Missing username or password')
    }

    const user = await db.getUser(email)
    const correctPassword = await db.verifyUser(user, password)
    if ( !correctPassword ) {
      next('Wrong username or password')
    }

    // Save user to session
    req.session.user = user.id
    res.redirect('editor')
  })

router.get('/editor', requireLogin, async (req, res, next) => {
  let resumeid = req.session.resume

  // If no resume is selected, choose the first one, then save to session
  if (!resumeid){
    const user_resumes = await db.getResumesFromUser(req.session.user)
    resumeid = user_resumes[0].id
    req.session.resume = resumeid
  }

  const resume = await db.getResume(resumeid)
  const experiences = await db.getExperiences(resumeid)

  try {
    res.render('editor', { resume: resume, experiences: experiences })
  } catch (err) {
    next('Could not load resume: ' + err)
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
        throw Error('Experience not found')
      }
  
      // Add education if exists
      let education
      try {
        education = await db.execute(`
        SELECT * FROM education
        WHERE resume = ${resumeid}`)
        education = education[0][0]
      } catch {
        throw Error('Education not found')
      }

      if (resume) {
        res.render('resume', { resume: resume, edu: education, exp: experience })
      } else {
        throw Error('Resume not found')
      }
    } catch (err) {
      // Not found, redirect to login
      res.render('login', { error: 'Could not get all required data: ' + err })
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
      // Send update to server
      await db.execute(`
      UPDATE resumes
      LEFT JOIN experiences ON experiences.resume = resumes.id
      LEFT JOIN education ON education.resume = resumes.id
      SET 
      resumes.name = '${r.name}',
      resumes.picture = '${r.picture}',
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

// Error handler
router.use((err, req, res, next) => {
  console.log('Caught by the error gang: ' + err)
  res.status(500).render('login', { error: err })
})

module.exports = router
