const mariadb = require('mariadb')

const url = new URL(process.env.DATABASE_URL)

;(async () => {
  console.log('host:', url.hostname, 'port:', url.port, 'db:', url.pathname, 'DB_SSL:', process.env.DB_SSL)
  try {
    const conn = await mariadb.createConnection({
      host: url.hostname,
      port: Number(url.port),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: true,
      connectTimeout: 20000,
    })
    console.log('CONNECTED', await conn.query('SELECT 1 AS ok'))
    await conn.end()
  } catch (e) {
    console.log('FAILED:', e.code, e.message)
  }
  process.exit(0)
})()