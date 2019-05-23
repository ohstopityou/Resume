'use strict'

const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const sqlConfig = require('./sqlconfig')

module.exports = class database {
  async connect () {
    this.db = await mysql.createConnection(sqlConfig)
  }

  async newUser (email, password) {
    // bcrypt hashes password pre insertion
    const hash = bcrypt.hashSync(password, 10)
    const [rows, fields] = await this.db.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hash]
    )
    return rows.insertId
  }

  async getUser (email) {
    const [rows, fields] = await this.db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    return rows[0]
  }

  async verifyUser (user, password) {
    const match = await bcrypt.compare(password, user.password)
    return match
  }

  // Creates a new resume, returns resume Id
  async newResume (userid) {
    // Resume does not exist, creating new resume
    const [rows, fields] = await this.db.execute(
      'INSERT INTO resumes (user_id) VALUES (?)',
      [userid]
    )
    return rows.insertId
  }

  async getResumesFromUser (userid) {
    const [rows, fields] = await this.db.execute(
      'SELECT * FROM resumes WHERE user_id = ?',
      [userid]
    )
    return rows
  }

  async getResume (resumeid) {
    const [rows, fields] = await this.db.execute(
      'SELECT * FROM resumes WHERE id = ?',
      [resumeid]
    )
    return rows
  }

  async newExperience (resumeid) {
    let db = await mysql.createConnection(sqlConfig)
    const [rows, fields] = await db.execute(
      'INSERT INTO experiences (resume_id) VALUES (?)',
      [resumeid]
    )
    return rows.insertId
  }

  async getExperiences (resumeid) {
    const [rows, fields] = await this.db.execute(
      'SELECT * FROM experiences WHERE resume_id = ?',
      [resumeid]
    )
    return rows
  }

  async deleteExperience (experienceid) {
    // todo
  }
}
