const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const https = require('https')
const moment = require('moment')
const session = require('express-session')

const { Server } = require('socket.io')
const cors = require('cors')
const fs = require('fs')
require('dotenv').config()

const port = 5000
const app = express()
// Middleware xử lý request
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({
  origin: 'https://localhost:4000',
  methods: ['POST']
}))

app.use(session({
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
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    // Helper formatDate để định dạng ngày
    formatDate: function (date, format) {
      return moment(date).format(format || 'YYYY-MM-DD')
    },
    // Helper formatCurrency để định dạng tiền tệ
    formatCurrency: function (value) {
      if (isNaN(value) || value === null || value === undefined) return '0 VND'
      const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
      return formatted.replace(/₫$/, 'VND'); // Thay thế ký hiệu "₫" bằng "VND"
    }
  }
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

const paymentRouter = require('../Subsystem/routers/paymentRouters')
app.use(paymentRouter)

// Cấu hình HTTPS
const options = {
  key: fs.readFileSync('../Mainsystem/sslkeys/key.pem'),
  cert: fs.readFileSync('../Mainsystem/sslkeys/cert.pem')
}
const server = https.createServer(options, app)

// Tích hợp Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://localhost:5000', // Phù hợp với domain của bạn
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
