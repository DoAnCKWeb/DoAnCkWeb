const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const passport = require('passport')
const session = require('express-session')
const https = require('https')

const { initializePassport } = require('./config/passport'); // Cấu hình Passport với chiến lược tự xây dựng
const fileUpload = require('express-fileupload')
const { Server } = require('socket.io'); // Sử dụng socket.io
const cors = require('cors')
const fs = require('fs')

const port = 4000
const app = express()
// Middleware xử lý
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(fileUpload())
app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Cấu hình session
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false,httpOnly: true,  maxAge: 1000 * 60 * 60 * 24 * 7 }
}))

// Khởi tạo passport
app.use(passport.initialize())
app.use(passport.session())
initializePassport(passport)

// Template engine
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts')
}))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

// Routers
const homeRouter = require('./routers/homeRouters')
app.use(homeRouter)

const registerRouter = require('./routers/registerRouters')
app.use(registerRouter)

const loginRouter = require('./routers/loginRouters')
app.use(loginRouter)

const logoutRoutes = require('./routers/logoutRouter')
app.use(logoutRoutes)

const options = {
  key: fs.readFileSync('./sslkeys/key.pem'),
  cert: fs.readFileSync('./sslkeys/cert.pem')
}
const server = https.createServer(options, app)

// Tích hợp Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

// Socket.IO xử lý kết nối
io.on('connection', (socket) => {
  // console.log('A user connected:', socket.id)

  // Gửi lịch sử tin nhắn cho client mới kết nối
  socket.emit('messageHistory', messages)

  // Log ngắt kết nối
  socket.on('disconnect', () => {
    // console.log('A user disconnected:', socket.id)
  })
})

server.listen(port, () => {
  console.log(`Example app listening at https://localhost:${port}`)
})
