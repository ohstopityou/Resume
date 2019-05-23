'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })
const multiformParser = require('multer')

// Connect to database
const Database = require('./database')
const db = new Database()
db.connect()

// Checks if user is logged in, else redirects to login
const requireLogin = (req, res, next) => {
  req.session.user ? next() : res.render('login')
}

// Checks if user has selected a resume, else selects the last made
const requireResume = (req, res, next) => {
  if (!req.session.resume) {
    console.log('No resume set. Selecting last one.')
    db.getResumeIdsFromUser(req.session.user).then(resumes => {
      req.session.resume = resumes.pop()
      next()
    })
  } else {
    next()
  }
}

// Ignores requests to favicon
router.get('/favicon.ico', (req, res) => res.sendStatus(204))

// Redirects to editor if logged in
router.get('/', requireLogin, (req, res) => {
  res.redirect('/login')
})

router.get('/test', async (req, res) => {
  let resume = await db.getResume(50)
  console.log(resume)
  // req.session.resume = null
  // let tst = await db.getExperiences(1)
  // let tst = await db.loginUser('a', 'b')
  // let exists = await db.userExists('test@uib.no')
  // let userid = await db.newUser('testbro', 'dude')
  // let resumeid = await db.newResume(userid)

  res.end()
})

// Handles signup requests
router.post('/signup', formParser, async (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  if (!email || !password) {
    next('Missing username or password')
  }
  const user = await db.getUser(email)
  if (user.length) {
    next('User already exists')
  }

  // Create new user, save to session
  const userid = await db.newUser(email, password)
  req.session.user = userid

  // Create new resume, save to session, redirect
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

router.get('/editor', requireLogin, requireResume, async (req, res, next) => {
  // Load resume and experience, then render in the editor
  const resumeid = req.session.resume
  console.log(resumeid)
  const resume = await db.getResume(resumeid)
  
  const experiences = await db.getExperiences(resumeid)
  res.render('editor', { resume: resume, experiences: experiences })
})

router.get('/logout', (req, res) => {
  req.session = null
  res.redirect('login')
})

router.route('/resume')
  .get(requireLogin, requireResume, async (req, res) => {
    const resumeid = req.session.resume
    // TODO: query both together
    const resume = await db.getResume(resumeid)
    const experiences = await db.getExperiences(resumeid)
    res.render('resume', { resume: resume, experiences: experiences })
  })
  .put(requireLogin, requireResume, multiformParser, async (req, res) => {
    console.log(req.body)
    res.end()
    // TODO
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
