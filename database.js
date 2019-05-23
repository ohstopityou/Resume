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
    const query = `INSERT INTO resumes (user_id) VALUES (?)`
    const [rows, fields] = await this.db.execute(query, [userid])
    return rows.insertId
  }

  // TODO: change to only select ids
  async getResumesFromUser (userid) {
    const query = `SELECT * FROM resumes WHERE user_id = ?`
    const [rows, fields] = await this.db.execute(query, [userid])
    return rows
  }

  async getResume (resumeid) {
    const query = `SELECT * FROM resumes WHERE id = ?`
    const [rows, fields] = await this.db.execute(query, [resumeid])
    return rows
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

  async deleteExperience (experienceid) {
    // todo
  }
}
