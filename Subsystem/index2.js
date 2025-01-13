const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const https = require('https');

const session = require('express-session')

const { Server } = require('socket.io')
const cors = require('cors')
const fs = require('fs')
require('dotenv').config(); 

const port = 5000;
const app = express()
// Middleware xử lý request
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({
  origin: 'https://localhost:4000', 
  methods: ['POST'],
}));

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
// Cấu hình Template Engine (Handlebars)
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
}))

app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

const paymentRouter = require('../Subsystem/routers/paymentRouters')
app.use(paymentRouter);

const { verifyToken } = require('./auth/auth'); // Import verifyToken từ file auth.js
const { db } = require('../Mainsystem/models/connectDatabase')
const {getTotalPrice}=require('../Subsystem/models/GetPricesFromItems')
app.post('/payment/process', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
  }

  try {
    // Giải mã token để lấy thông tin người dùng và sản phẩm
    const decoded = verifyToken(token); // Sử dụng hàm verifyToken từ auth.js

    // Trích xuất thông tin từ token
    const { user_id, items } = decoded;

    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Thông tin thanh toán không hợp lệ' });
    }

    // Tính tổng giá trị thanh toán
    const total = await getTotalPrice(items);

    // Lưu thông tin đơn hàng vào bảng orders
    const orderRes = await db.query(
      'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id',
      [user_id, total, 'completed']
    );
    const orderId = orderRes[0].id;

    // Thêm từng sản phẩm vào bảng order_items
    for (let item of items) {
      const { id: productId, quantity } = item;
      // Lấy giá sản phẩm từ bảng products
      const productRes = await db.query('SELECT price FROM products WHERE product_id = $1', [productId]);
      const price = productRes[0]?.price;

      if (price !== undefined) {
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, productId, quantity, price]
        );
      } else {
        console.log(`Không tìm thấy sản phẩm với id ${productId}`);
      }
    }

    res.json({ success: true, message: 'Thanh toán thành công' });
  } catch (error) {
    console.error('Lỗi khi xử lý thanh toán:', error);
    res.status(500).json({ success: false, message: 'Có lỗi khi xử lý thanh toán' });
  }
});

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
