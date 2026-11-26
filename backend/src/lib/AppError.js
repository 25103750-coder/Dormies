// ============================================================================================
// FILE: backend/src/lib/AppError.js
// PART OF: Back end > Helpers
// WHAT IT DOES: An error we throw on purpose (404, 409...). The error handler turns it into a JSON
//               message for the front end.
// ============================================================================================
// error we throw on purpose, the error handler turns it into a json response
class AppError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors || null
  }
}
module.exports = AppError
