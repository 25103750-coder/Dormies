// ============================================================================================
// FILE: backend/src/lib/jwt.js
// PART OF: Back end > Helpers
// WHAT IT DOES: Creates and checks the login token (JWT). The token holds the user id and role and
//               expires after JWT_EXPIRES_HOURS.
// ============================================================================================
const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresHours } = require('../config/env')

// the token carries the user id and role and expires after JWT_EXPIRES_HOURS (session timeout)
const createToken = (payload) => jwt.sign(payload, jwtSecret, { expiresIn: `${jwtExpiresHours}h` })

// returns the payload, or null when the token is wrong or expired
function verifyToken(token) {
  try {
    return jwt.verify(String(token || ''), jwtSecret)
  } catch {
    return null
  }
}

module.exports = { createToken, verifyToken }
