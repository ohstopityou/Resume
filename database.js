'use strict'

const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig')
const { Storage } = require('@google-cloud/storage')

module.exports = class database {
  // Connects to SQL and Cloud Storage on initialization.
  async connect () {
    this.db = await mysql.createConnection(sqlConfig)
    // TODO: Change to config when in production
    this.storage = new Storage({
      keyFilename: 'cloud_storage_key.json',
      projectId: 'silicon-synapse-232018'
    })
  }

  async uploadImg (img, resumeid) {
    // Create unique name for cloud storage
    const ext = img.originalname.split('.').pop()
    const fileName = `${Date.now()}.${ext}`

    // Upload image to cloud bucket
    await this.storage
      .bucket('resume-profilepictures')
      .file(fileName)
      .save(img.buffer)

    // Upload image URL to SQL database
    const url = `https://storage.googleapis.com/${bucketName}/${fileName}`
    const query = `UPDATE resumes SET picture = ? WHERE id = ?`
    await this.db.execute(query, [url, resumeid])
  }

  // Creates a new user with hashed password
  async newUser (email, password) {
    const hash = bcrypt.hashSync(password, 10)
    const query = `INSERT INTO users (email, password) VALUES (?, ?)`
    const [rows, fields] = await this.db.execute(query, [email, hash])
    // Returns ID of new user
    return rows.insertId
  }

  // Retrieves a user by its email (used for login)
  async getUser (email) {
    const query = `SELECT * FROM users WHERE email = ?`
    const [rows, fields] = await this.db.execute(query, [email])
    // Returns user object
    return rows[0]
  }

  // Verifies that a submitted password matches the users hashed password
  async verifyUser (user, password) {
    const match = await bcrypt.compare(password, user.password)
    // Returns a boolean
    return match
  }

  // Creates a new resume for a user
  async newResume (userid) {
    const defaultPic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    const query = `INSERT INTO resumes (user_id, picture) VALUES (?, ?)`
    const [rows, fields] = await this.db.execute(query, [userid, defaultPic])
    // Returns ID of new resume
    return rows.insertId
  }

  // Retrieves a list of resume IDs belonging to the user id
  // Made to create a dashboard where the user can select between their resumes
  async getResumeIdsFromUser (userid) {
    const query = `SELECT id FROM resumes WHERE user_id = ?`
    const [rows, fields] = await this.db.execute(query, [userid])
    return rows
  }

  // Retrieves a resume object
  async getResume (resumeid) {
    const query = `SELECT * FROM resumes WHERE id = ?`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows[0]
  }

  // Creates a new experience for a resume
  async newExperience (resumeid) {
    const query = `INSERT INTO experiences (resume_id) VALUES (?)`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    // Returns ID of new experience
    return rows.insertId
  }

  // Retrieves a list of experience objects belonging to the resume id
  async getExperiences (resumeid) {
    const query = `SELECT * FROM experiences WHERE resume_id = ?`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows
  }

  // Updates a resume using a resume object
  async updateResume (resume) {
    const query = `
    UPDATE resumes
    SET worktitle = ?,
    summary = ?,
    name = ?,
    email = ?,
    phone = ?,
    address = ?,
    postcode = ?,
    city = ?
    WHERE id = ?`
    await this.db.execute(query,
      [
        resume.worktitle,
        resume.summary,
        resume.name,
        resume.email,
        resume.phone,
        resume.address,
        resume.postcode,
        resume.city,
        resume.id
      ])
  }

  // Updates an experience using an experience object
  async updateExperience (experience) {
    const query = `
    UPDATE experiences
    SET title = ?,
    location = ?,
    start = ?,
    end = ?,
    summary = ?
    WHERE id = ?`
    await this.db.execute(query,
      [
        experience.title,
        experience.location,
        experience.start,
        experience.end,
        experience.summary,
        experience.id
      ])
  }

  // Deletes an experience using an experience id
  async deleteExperience (experienceid) {
    const query = `DELETE FROM experiences WHERE id = ?`
    await this.db.execute(query, [experienceid])
  }
}
