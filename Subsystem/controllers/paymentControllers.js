
const { verifyToken } = require('../auth/auth'); // Import verifyToken từ file auth.js
const { db } = require('../models/connectDatabase')
const {getTotalPrice}=require('../models/GetPricesFromItems')
const paymentHandle = async (req, res) => {
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
}
module.exports={paymentHandle}