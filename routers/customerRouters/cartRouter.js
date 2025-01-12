const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

router.post('/cart/add', async (req, res) => {
  const { product_id, quantity } = req.body;
  //const role=req.query.role;

  try {
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'product_id và quantity là bắt buộc.' });
    }

    if (req.session?.user_id) {
      const user_id = req.session.user_id;

      // Lấy giỏ hàng hiện tại của user
      let cart = await db.oneOrNone(
        'SELECT id FROM cart WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user_id]
      );

      if (!cart) {
        cart = await db.one(
          'INSERT INTO cart (user_id, session_id) VALUES ($1, $2) RETURNING id',
          [user_id, req.sessionID]
        );
      }

      const cart_id = cart.id;

      // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
      const existingItem = await db.oneOrNone(
        'SELECT id FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart_id, product_id]
      );

      if (existingItem) {
        // Nếu sản phẩm đã tồn tại, cập nhật số lượng
        await db.none(
          'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingItem.id]
        );
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới
        const product = await db.one('SELECT price FROM products WHERE product_id = $1', [product_id]);
        await db.none(
          'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [cart_id, product_id, quantity, product.price]
        );
      }
//res.redirect(`/${role}`);
      //return res.json({ success: true, message: 'Sản phẩm đã được thêm vào giỏ hàng.' });
    } else {
      // Chưa đăng nhập, sử dụng giỏ hàng tạm thời
      const session_id = req.sessionID;

      const existingItem = await db.oneOrNone(
        'SELECT id FROM temporary_cart WHERE session_id = $1 AND product_id = $2',
        [session_id, product_id]
      );

      if (existingItem) {
        await db.none(
          'UPDATE temporary_cart SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingItem.id]
        );
      } else {
        const product = await db.one('SELECT price FROM products WHERE product_id = $1', [product_id]);
        await db.none(
          'INSERT INTO temporary_cart (session_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [session_id, product_id, quantity, product.price]
        );
      }
//res.redirect(`/${role}`);    
    res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng.' });
    }
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
  }
});

// Lấy số lượng sản phẩm trong giỏ hàng

router.get('/cart/items-count', async (req, res) => {
  try {
    let totalItems = 0;

    if (req.session?.user_id) {
      // Người dùng đã đăng nhập
      const user_id = req.session.user_id;

      const result = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total
         FROM cart_items
         WHERE cart_id IN (SELECT id FROM cart WHERE user_id = $1)`,
        [user_id]
      );
      totalItems = result?.total || 0;
    } else {
      // Người dùng chưa đăng nhập
      const session_id = req.sessionID;

      const result = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total
         FROM temporary_cart
         WHERE session_id = $1`,
        [session_id]
      );
      totalItems = result?.total || 0;
    }

    res.json({ success: true, count: totalItems });
  } catch (error) {
    console.error('Lỗi khi lấy số lượng sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng sản phẩm.' });
  }
});


// Hiển thị giỏ hàng (phân trang)
router.get('/cart', async (req, res) => {
  try {
    let items = [];
    let total = 0;
    const { page = 1, limit = 8 } = req.query; // Mặc định mỗi trang hiển thị 8 sản phẩm
    const offset = (page - 1) * limit;
    const role = req.session.role;

    if (req.session?.user_id) {
      const user_id = req.session.user_id;

      // Lấy sản phẩm từ giỏ hàng
      items = await db.any(
        `SELECT 
           ci.product_id AS id, 
           p.product_name, 
           p.storage_capacity, 
           p.image, 
           SUM(ci.quantity) AS quantity, 
           ci.price, 
           SUM(ci.quantity * ci.price) AS sum_price
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
         JOIN cart c ON ci.cart_id = c.id
         WHERE c.user_id = $1
         GROUP BY ci.product_id, p.product_name, p.storage_capacity, p.image, ci.price
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );
    } else {
      const session_id = req.sessionID;

      // Lấy sản phẩm từ giỏ hàng tạm thời
      items = await db.any(
        `SELECT 
           tc.id, 
           p.product_id, 
           p.product_name, 
           p.storage_capacity, 
           p.image, 
           tc.quantity, 
           tc.price, 
           (tc.quantity * tc.price) AS sum_price
         FROM temporary_cart tc
         JOIN products p ON tc.product_id = p.product_id
         WHERE tc.session_id = $1
         LIMIT $2 OFFSET $3`,
        [session_id, limit, offset]
      );
    }

    // Tính tổng tiền
    total = items.reduce((sum, item) => sum + parseFloat(item.sum_price || 0), 0);

    // Lấy tổng số sản phẩm
    const totalItems = await db.one(
      req.session?.user_id
        ? 'SELECT COUNT(*) FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = $1'
        : 'SELECT COUNT(*) FROM temporary_cart WHERE session_id = $1',
      [req.session?.user_id || req.sessionID]
    );
    const totalPages = Math.ceil(totalItems.count / limit);

    res.render('customerViews/cart', { items, total, totalPages, currentPage: parseInt(page, 10),role });
  } catch (error) {
    console.error('Lỗi khi hiển thị giỏ hàng:', error);
    res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', async (req, res) => {
  const { id } = req.body;
  console.log(id);
  try {
    if (!id) {
      return res.status(400).json({ message: 'ID là bắt buộc.' });
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
        'DELETE FROM temporary_cart WHERE id = $1 AND session_id = $2',
        [id, req.sessionID]
      );
    }

    res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});


module.exports = router;
