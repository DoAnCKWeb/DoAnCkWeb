const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const passport = require('passport')
const session = require('express-session')
// const pgSession = require('connect-pg-simple')(session); // Thư viện lưu session vào PostgreSQL
const https = require('https')
const fileUpload = require('express-fileupload')
const { Server } = require('socket.io')
const cors = require('cors')
const fs = require('fs')
require('dotenv').config(); // Load biến môi trường từ file .env

// const { Pool } = require('pg')
const { initializePassport } = require('./config/passport'); // Cấu hình Passport với chiến lược tự xây dựng

const port = 4000
const app = express()

// Cấu hình Pool kết nối tới PostgreSQL
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456789@localhost:5432/web',
// })

// Middleware xử lý request
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(fileUpload())
app.use(cors({
  origin: 'https://localhost:4000', // Đảm bảo phù hợp với domain của bạn
  credentials: true, // Cho phép gửi cookie qua domain khác
}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use(session({
  // store: new pgSession({
  //     pool,
  //     tableName: 'session',
  // }),
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true, // Đảm bảo dùng HTTPS
    httpOnly: true,
    sameSite: 'lax', // Cookie chỉ gửi khi điều hướng từ cùng domain
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 ngày
  }
}))

// Khởi tạo Passport
app.use(passport.initialize())
app.use(passport.session())
initializePassport(passport)

// Cấu hình Template Engine (Handlebars)
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    formatCurrency: function (value) {
      if (isNaN(value) || value === null || value === undefined) return '0 VND'
      const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
      return formatted.replace(/₫$/, 'VND'); // Thay thế ký hiệu "₫" bằng "VND"
    },

    eq: function (a, b) {
      return a === b
    },
    range: function (start, end) {
      const range = []
      for (let i = start; i <= end; i++) {
        range.push(i)
      }
      return range
    },
    add: function (a, b) {
      return a + b
    },
    subtract: function (a, b) {
      return a - b
    },
    gt: function (a, b) {
      return a > b
    },
    lt: function (a, b) {
      return a < b
    },
    json: function (context) {
      return JSON.stringify(context)
    }
  }
}))

app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

// Định nghĩa Routers
// const homeRouter = require('./routers/homeRouters')
const registerRouter = require('./routers/registerRouters')
const loginRouter = require('./routers/loginRouters')
const logoutRouter = require('./routers/logoutRouter')
const adminRouter = require('./routers/adminRouters/adminRouters')
const customerRouter = require('./routers/customerRouters/customerRouter')
const cartRouter = require('./routers/customerRouters/cartRouter')

// Sử dụng Routers
// app.use(homeRouter)
app.use(registerRouter)
app.use(loginRouter)
app.use(logoutRouter)
app.use(adminRouter)
app.use(customerRouter)
app.use(cartRouter)

// Cấu hình HTTPS
const options = {
  key: fs.readFileSync('./sslkeys/key.pem'),
  cert: fs.readFileSync('./sslkeys/cert.pem')
}
const server = https.createServer(options, app)

// Tích hợp Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://localhost:4000', // Phù hợp với domain của bạn
    credentials: true, // Cho phép cookie
  }
})

// Xử lý sự kiện kết nối qua Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  // Log ngắt kết nối
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
  })
})

// Khởi động server
server.listen(port, () => {
  console.log(`Server đang chạy tại https://localhost:${port}`)
})
