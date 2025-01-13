const pgp = require('pg-promise')({
  capSQL: true, // Optional: Để hỗ trợ SQL không phân biệt chữ hoa/thường
})

const dbConfig = {
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'webofffical'
}

const db = pgp(dbConfig)

console.log('Kết nối thành công!')
module.exports = { db };