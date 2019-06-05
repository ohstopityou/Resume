'use strict'

const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig')
const { Storage } = require('@google-cloud/storage')

module.exports = class database {
  async connect () {
    this.db = await mysql.createConnection(sqlConfig)
    this.storage = new Storage({
      keyFilename: 'cloud_storage_key.json',
      projectId: 'silicon-synapse-232018'
    })
  }

  async uploadImg (img, resumeid) {
    const ext = img.originalname.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const bucketName = 'resume-profilepictures'

    // Upload URL to SQL before file to save time
    const url = `https://storage.googleapis.com/${bucketName}/${fileName}`
    const query = `UPDATE resumes SET picture = ? WHERE id = ?`
    this.db.execute(query, [url, resumeid])

    // Upload image to cloud bucket
    await this.storage
      .bucket(bucketName)
      .file(fileName)
      .save(img.buffer)
  }

  async newUser (email, password) {
    // bcrypt hashes password pre insertion
    const hash = bcrypt.hashSync(password, 10)
    const query = `INSERT INTO users (email, password) VALUES (?, ?)`
    const [rows, fields] = await this.db.execute(query, [email, hash])
    return rows.insertId
  }

  async getUser (email) {
    const query = `SELECT * FROM users WHERE email = ?`
    const [rows, fields] = await this.db.execute(query, [email])
    return rows[0]
  }

  async verifyUser (user, password) {
    const match = await bcrypt.compare(password, user.password)
    return match
  }

  // Creates a new resume, returns resume Id
  async newResume (userid) {
    const defaultPic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    const query = `INSERT INTO resumes (user_id, picture) VALUES (?, ?)`
    const [rows, fields] = await this.db.execute(query, [userid, defaultPic])
    return rows.insertId
  }

  async getResumeIdsFromUser (userid) {
    const query = `SELECT id FROM resumes WHERE user_id = ?`
    const [rows, fields] = await this.db.execute(query, [userid])
    return rows
  }

  async getResume (resumeid) {
    const query = `SELECT * FROM resumes WHERE id = ?`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows[0]
  }

  async newExperience (resumeid) {
    const query = `INSERT INTO experiences (resume_id) VALUES (?)`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows.insertId
  }

  async getExperiences (resumeid) {
    const query = `SELECT * FROM experiences WHERE resume_id = ?`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows
  }

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

  async deleteExperience (experienceid) {
    const query = `DELETE FROM experiences WHERE id = ?`
    await this.db.execute(query, [experienceid])
  }
}
