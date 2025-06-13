// File: backend/models/userModel.js

const db     = require('./db');
const bcrypt = require('bcryptjs');

async function findUserByUsername(username) {
  const [rows] = await db.query(
    `SELECT username, email, password
     FROM users
     WHERE username = ?`,
    [username]
  );
  return rows[0] || null;
}

async function createUser({ username, email, password }) {
  const hash = await bcrypt.hash(password, 12);
  const [result] = await db.query(
    `INSERT INTO users (username, email, password)
     VALUES (?, ?, ?)`,
    [username, email, hash]
  );
  // you can return result.insertId if you ever add an auto-increment PK later
  return result;  
}

module.exports = {
  findUserByUsername,
  createUser
};
