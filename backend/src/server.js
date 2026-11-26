// ============================================================================================
// FILE: backend/src/server.js
// PART OF: Back end > start
// WHAT IT DOES: Starts the back end. Checks that the database can be read, fills it with the sample
//               data on the very first run, then listens on the port (5000).
// ============================================================================================
const { port } = require('./config/env')
const db = require('./config/db')
const app = require('./app')

async function start() {
  // first run: fill the database with the sample data
  let hasUsers
  try {
    hasUsers = (await db.get('SELECT COUNT(*) AS c FROM users')).c > 0
  } catch (err) {
    console.error('\nCould not read the database. Is MySQL running and are the tables created?')
    console.error('  1) check DATABASE_URL in backend/.env')
    console.error('  2) run:  npx prisma db push\n')
    console.error(err.message)
    process.exit(1)
  }
  if (!hasUsers) {
    console.log('Database is empty, adding sample data...')
    await require('./config/seed').run()
  }

  app.listen(port, () => {
    console.log(`\nDormies API is running on http://localhost:${port}`)
    console.log('Health check: http://localhost:' + port + '/api/health\n')
  })
}

start()
