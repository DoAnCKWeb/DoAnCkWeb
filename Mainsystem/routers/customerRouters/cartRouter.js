const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/customerControllers/cartController');

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', cartController.addToCart);

// Lấy số lượng sản phẩm trong giỏ hàng
router.get('/cart/items-count', cartController.getItemsCount);

// Hiển thị giỏ hàng
router.get('/cart', cartController.viewCart);

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', async (req, res) => {
  const { id } = req.body; // `id` là `product_id`

  try {
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID là bắt buộc.' });
    }

    if (req.session?.user_id) {
      // Người dùng đã đăng nhập
      await db.none(
        'DELETE FROM cart_items WHERE product_id = $1 AND cart_id IN (SELECT id FROM cart WHERE user_id = $2)',
        [id, req.session.user_id]
      );
    } else {
      // Người dùng chưa đăng nhập
      await db.none(
        'DELETE FROM temporary_cart WHERE product_id = $1 AND session_id = $2',
        [id, req.sessionID]
      );
    }

    // Sau khi xóa, tính lại số lượng sản phẩm
    let totalItems = 0;

    if (req.session?.user_id) {
      const user_id = req.session.user_id;
      const result = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total
         FROM cart_items
         WHERE cart_id IN (SELECT id FROM cart WHERE user_id = $1)`,
        [user_id]
      );
      totalItems = result?.total || 0;
    } else {
      const session_id = req.sessionID;
      const result = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total
         FROM temporary_cart
         WHERE session_id = $1`,
        [session_id]
      );
      totalItems = result?.total || 0;
    }

    res.json({ success: true, message: 'Sản phẩm đã được xóa khỏi giỏ hàng.', totalItems });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

//Tạo token 
const jwt = require('jsonwebtoken');
// Secret key để mã hóa token (đặt trong biến môi trường)
const SECRET_KEY ='your_secret_key';

// Tạo token
function generateToken(user_id, selectedItems) {
  const payload = {
    user_id,
    items: selectedItems, // Danh sách sản phẩm: [{ id, quantity }]
  };

  // Tạo token với thời gian hết hạn (ví dụ: 1 giờ)
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

const axios = require('axios');
const https = require('https');

// Tạo một agent HTTPS để bỏ qua chứng chỉ SSL
const agent = new https.Agent({  
  rejectUnauthorized: false  // Bỏ qua kiểm tra chứng chỉ SSL (self-signed certificate)
});

router.post('/payment/:ids', async (req, res) => {
  if (!req.isAuthenticated()) {
    // Thêm message thông báo yêu cầu đăng nhập
    req.flash('error', 'Yêu cầu bạn đăng nhập để thanh toán');
    return res.redirect('/login');
  }

  const user_id = req.session.user_id;
  const idsString = req.params.ids;

  // Tách danh sách id và số lượng
  const selectedItems = idsString.split(',').map((item) => {
    const [id, quantity] = item.split(':');
    return { id: id.trim(), quantity: parseInt(quantity, 10) || 1 }; // Mặc định số lượng là 1
  });

  try {
    // Tạo token chứa thông tin user và sản phẩm
    const token = generateToken(user_id, selectedItems);

    // Gửi token tới server 2 để xử lý thanh toán, sử dụng agent bỏ qua chứng chỉ SSL
    const response = await axios.post('https://localhost:5000/payment/process', {
      token: token,
    }, { httpsAgent: agent });

    if (response.data.success) {
      // Thanh toán thành công
      res.redirect('/cart?message=Thanh toán thành công');
    } else {
     // Thanh toán thất bại
      res.redirect(`/cart?message=${encodeURIComponent(response.data.message)}`);
    }
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi yêu cầu thanh toán.' });
  }
});


router.post('/cart/remove', cartController.removeItem);

// Thanh toán
router.post('/payment/:ids', cartController.processPayment);

module.exports = router;
