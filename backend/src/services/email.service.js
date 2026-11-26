// ============================================================================================
// FILE: backend/src/services/email.service.js
// PART OF: Back end > Services
// WHAT IT DOES: There is no mail server, so emails are written to backend/logs/emails.log. Only this
//               file must change to send real emails.
// ============================================================================================
// There is no real mail server in the project, so emails are written to logs/emails.log.
// To send real emails later, only this function needs to change (for example with nodemailer).
const fs = require('fs')
const path = require('path')
const { root } = require('../config/env')
const { now } = require('../lib/dates')

const logFile = path.join(root, 'logs', 'emails.log')

// returns the delivery status that is saved with the notification
function send(to, subject, body) {
  if (!to) return 'Skipped'
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true })
    fs.appendFileSync(logFile, `[${now()}] TO: ${to}\nSUBJECT: ${subject}\n${body}\n${'-'.repeat(50)}\n`)
    return 'Sent'
  } catch {
    return 'Failed'
  }
}

module.exports = { send }
