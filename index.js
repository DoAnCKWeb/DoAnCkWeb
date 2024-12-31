const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');
const https = require('https');
const fileUpload = require('express-fileupload');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

require('dotenv').config(); // Load biến môi trường từ file .env

const { initializePassport } = require('./config/passport'); // Cấu hình Passport với chiến lược tự xây dựng

const port = 4000;
const app = express();

// Middleware xử lý request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set thành true nếu sử dụng HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 ngày
  }
}));

// Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);

// Cấu hình Template Engine (Handlebars)
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    formatCurrency: function (value) {
      if (isNaN(value) || value === null || value === undefined) return "0";
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
    eq: function (a, b) {
      return a === b;
    },
    json: function (context) {
      return JSON.stringify(context);
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Định nghĩa Routers
const homeRouter = require('./routers/homeRouters');
const registerRouter = require('./routers/registerRouters');
const loginRouter = require('./routers/loginRouters');
const logoutRouter = require('./routers/logoutRouter');
const adminRouter = require('./routers/adminRouters/adminRouters');
const customerRouter = require('./routers/customerRouters/customerRouter');
const cartRouter = require('./routers/customerRouters/cartRouter');

// Sử dụng Routers
app.use(homeRouter);
app.use(registerRouter);
app.use(loginRouter);
app.use(logoutRouter);
app.use(adminRouter);
app.use(customerRouter);
app.use(cartRouter);

// Cấu hình HTTPS
const options = {
  key: fs.readFileSync('./sslkeys/key.pem'),
  cert: fs.readFileSync('./sslkeys/cert.pem')
};
const server = https.createServer(options, app);

// Tích hợp Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Xử lý sự kiện kết nối qua Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Log ngắt kết nối
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Khởi động server
server.listen(port, () => {
  console.log(`Server đang chạy tại https://localhost:${port}`);
});
