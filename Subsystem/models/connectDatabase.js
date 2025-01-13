const pgp = require('pg-promise')({
  capSQL: true, // Optional: Để hỗ trợ SQL không phân biệt chữ hoa/thường
})

const dbConfig = {
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
}

const db = pgp(dbConfig)

console.log('Kết nối thành công!')
module.exports = { db };