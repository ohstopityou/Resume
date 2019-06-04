'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })
const Multer = require('multer')
const multerconfig = {
  storage: Multer.MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5Mb
}
const multiformParser = Multer(multerconfig).single('profilepic')

// Connect to database
const Database = require('./database')
const db = new Database()
db.connect()

// Login middleware
const requireLogin = (req, res, next) => {
  // Renders login screen if not logged in
  req.session.user ? next() : res.render('login')
}

// Resume middleware
const requireResume = (req, res, next) => {
  // Continues if a resume is selected
  if (req.session.resume) return next()
  // else selects the last resume made
  db.getResumeIdsFromUser(req.session.user)
    .then(resumes => {
      req.session.resume = resumes.pop().id
      next()
    })
}

// Ignores requests to favicon
router.get('/favicon.ico', (req, res) => res.sendStatus(204))

// Redirects to editor if logged in
router.get('/', requireLogin, (req, res) => {
  res.redirect('/login')
})

// Handles signup requests
router.post('/signup', formParser, async (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  if (!email || !password) return next('Missing username or password')

  const user = await db.getUser(email)
  if (user) return next('User already exists')

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
  .post(formParser, async (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    if (!email || !password) return next('Missing username or password')

    const user = await db.getUser(email)
    const correctPassword = await db.verifyUser(user, password)
    if (!correctPassword) return next('Wrong username or password')

    // Save user to session
    req.session.user = user.id
    res.redirect('editor')
  })

router.get('/editor', requireLogin, requireResume, async (req, res) => {
  // Load resume and experience, then render in the editor
  const resumeid = req.session.resume
  const [resume, experiences] = await Promise.all([db.getResume(resumeid), db.getExperiences(resumeid)])
  res.render('editor', { resume: resume, experiences: experiences })
})

router.get('/logout', (req, res) => {
  req.session = null
  res.redirect('login')
})

router.route('/resume')
  .get(requireLogin, requireResume, async (req, res) => {
    const resumeid = req.session.resume
    const [resume, experiences] = await Promise.all([db.getResume(resumeid), db.getExperiences(resumeid)])
    res.render('resume', { resume: resume, experiences: experiences })
  })
  .put(multiformParser, async (req, res, next) => {
    // Array that holds functions to be run in parallell
    const ioPromises = []

    // Create valid resume and update
    let resume = req.body
    for (let key in resume) { resume[key] = resume[key] || null }
    ioPromises.push(db.updateResume(resume))

    // Update all experiences
    let experiences = resume.exp
    if (experiences) {
      for (let id in experiences) { ioPromises.push(db.updateExperience(experiences[id])) }
    }

    // Upload profile picture to cloud
    if (req.file) { ioPromises.push(db.uploadImg(req.file, resume.id)) }

    Promise.all(ioPromises)
      .then(res.sendStatus(204))
      .catch(next)
  })

router.post('/experience/new', requireLogin, requireResume, (req, res) => {
  db.newExperience(req.session.resume)
})

router.delete('/experience/:id', requireLogin, requireResume, async (req, res) => {
  // TODO: check if experience belongs to resume
  db.deleteExperience(req.params.id)
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
