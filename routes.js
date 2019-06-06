'use strict'

const router = require('express').Router()
const formParser = require('body-parser').urlencoded({ extended: false })

// Parser configured to recieve a form including a single image.
// Stores the image profilepic (max 5MB) in memory.
const Multer = require('multer')
const multiformParser = Multer({
  storage: Multer.MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('profilepic')

// Connect to database
const Database = require('./database')
const db = new Database()
db.connect()

// Middleware that makes sure user is available in cookie
const requireLogin = (req, res, next) => {
  // Renders login screen if not logged in
  req.session.user ? next() : res.render('login')
}

// Ignores requests to favicon
router.get('/favicon.ico', (req, res) => res.sendStatus(204))

// Handles signup requests sent from normal form
router.post('/signup', formParser, async (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  if (!email || !password) return next('Missing username or password')

  const user = await db.getUser(email)
  if (user) return next('User already exists')

  // Create new user, save to session
  const userid = await db.newUser(email, password)
  req.session.user = userid

  // Create new resume with 1 experience, redirect
  const resumeid = await db.newResume(userid)
  await db.newExperience(resumeid)
  res.redirect('/')
})

// Handles login requests sent from normal form
router.post('/login', formParser, async (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  if (!email || !password) return next('Missing username or password')

  const user = await db.getUser(email)
  if (!user) return next('User not found')

  const correctPassword = await db.verifyPass(password, user.password)
  if (!correctPassword) return next('Wrong username or password')

  // Save user to session, redirect
  req.session.user = user.id
  res.redirect('/')
})

// Handles requests to view editor
router.get('/editor/:id', requireLogin, async (req, res, next) => {
  const resumeid = req.params.id
  // Save resume to session
  req.session.resume = resumeid
  // Query db for resume and experiences in parallell
  Promise.all([db.getResume(resumeid), db.getExperiences(resumeid)])
    // Render editor using data recieved from query. Data is an array containing both responses
    .then(data => res.render('editor', { resume: data.shift(), experiences: data.shift() }))
    .catch(err => next('Could not load editor: ' + err))
})

// Home screen where you choose between your resumes
router.get('/home', requireLogin, async (req, res, next) => {
  db.getResumeIdsFromUser(req.session.user)
    .then(ids => res.render('home', { resumeIds: ids }))
    .catch(err => next('Could not load resumes: ' + err))
})

router.route('/resume/:id')
  // Handles requests to view resume (used by preview iframe)
  .get(requireLogin, async (req, res, next) => {
    const resumeid = req.params.id
    // Query db for resume and experiences in parallell
    Promise.all([db.getResume(resumeid), db.getExperiences(resumeid)])
      // Render resume using data recieved from query. Data is an array containing both responses
      .then(data => res.render('resume', { resume: data.shift(), experiences: data.shift() }))
      .catch(err => {
        console.error(err)
        // Simple error page to be shown in iframes
        res.status(500).render('iframeError')
      })
  })
  // Handles resume updates sent from multipart form
  .put(requireLogin, multiformParser, async (req, res, next) => {
    // Array that holds I/O operations
    const ioPromises = []

    // Create valid resume and update
    let resume = req.body
    // TODO Verify if null is set correctly
    for (let key in resume) { resume[key] = resume[key] || null }
    ioPromises.push(db.updateResume(resume))

    // Update all evailable experiences
    let experiences = resume.exp
    if (experiences) {
      for (let id in experiences) { ioPromises.push(db.updateExperience(experiences[id])) }
    }

    // Upload profile picture to cloud
    // TODO: Check if file is an image
    if (req.file) { ioPromises.push(db.uploadImg(req.file, resume.id)) }

    // Runs I/O operations on db in parallell
    Promise.all(ioPromises)
      // Returns 204 if update ok, else forward error to errorhandler
      .then(ok => res.sendStatus(204))
      .catch(next)
  })
  // Deletes a resume and its experiences
  .delete(requireLogin, async (req, res, next) => {
    db.deleteResume(req.params.id)
      .then(ok => res.sendStatus(204))
      .catch(next)
  })

router.post('/resume/new', requireLogin, (req, res, next) => {
  db.newResume(req.session.user)
    .then(id => db.newExperience(id))
    .then(ok => res.sendStatus(204))
    .catch(next)
})

// Handles requests to add a new experience to current resume
router.post('/resume/:id/experience/new', requireLogin, (req, res, next) => {
  db.newExperience(req.params.id)
    .then(ok => res.sendStatus(204))
    .catch(next)
})

// Handles requests to delete a specific experience
// TODO: FIX: Experience can be deleted by anyone
router.delete('/experience/:id', requireLogin, async (req, res, next) => {
  db.deleteExperience(req.params.id)
    .then(ok => res.sendStatus(204))
    .catch(next)
})

// Deletes user session and redirects to homepage
router.get('/logout', (req, res, next) => {
  req.session = null
  res.redirect('/')
})

// Homepage route. Redirects to editor
router.get('/', requireLogin, (req, res) => {
  res.redirect('home')
})

// Redirects all other requests to homepage
// TODO: Better 404 error handler. Use next below
router.all('*', (req, res) => {
  res.status(404).redirect('/')
})

// Middleware that handles all errors. Called using next()
router.use((err, req, res, next) => {
  // Prints error to server console
  console.error(err)

  // Renders login screen with error message box
  if (!req.session.user) {
    res.render('login', { error: err })
  } else {
    res.render('home', { error: err })
  }
})

module.exports = router
