
const { verifyToken } = require('../auth/auth'); // Import verifyToken từ file auth.js
const { db } = require('../models/connectDatabase')
const { getTotalPrice } = require('../models/GetPricesFromItems')
const {GetMoney}=require('../models/GetMoney')
const paymentHandle = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
  }

  try {
    const decoded = verifyToken(token);
    const { user_id, items } = decoded;

    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Thông tin thanh toán không hợp lệ' });
    }

    const total = parseFloat(await getTotalPrice(items));
    const money_account = await GetMoney(user_id);
    if (!money_account || !money_account.balance) {
      throw new Error('Không tìm thấy tài khoản thanh toán');
    }

    const balance = parseFloat(money_account.balance);
    //console.log('Tổng thanh toán:', total, 'Số dư:', balance);

    if (balance >= total) {
      // Logic thanh toán thành công
      const orderRes = await db.query(
        'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id',
        [user_id, total, 'completed']
      );
      const orderId = orderRes[0].id;

      for (let item of items) {
        const { id: productId, quantity } = item;
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
    } else {
      res.json({ success: false, message: 'Thanh toán thất bại vì không đủ số dư' });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý thanh toán:', error);
    res.status(500).json({ success: false, message: 'Có lỗi khi xử lý thanh toán' });
  }
};

module.exports={paymentHandle}