const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
      console.log('Session ID during add to cart:', req.sessionID);

      if (!product_id || !quantity) {
          return res.status(400).json({ message: 'product_id và quantity là bắt buộc.' });
      }

      if (req.session?.user_id) {
          // Đã đăng nhập: Thêm vào `cart_items`
          const user_id = req.session.user_id;
          let cart = await db.oneOrNone('SELECT * FROM cart WHERE user_id = $1', [user_id]);

          if (!cart) {
              cart = await db.one(
                  'INSERT INTO cart (user_id, session_id) VALUES ($1, $2) RETURNING id',
                  [user_id, req.sessionID]
              );
          }

          const existingItem = await db.oneOrNone(
              'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
              [cart.id, product_id]
          );

          if (existingItem) {
              await db.none(
                  'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
                  [quantity, existingItem.id]
              );
          } else {
              const product = await db.one('SELECT * FROM products WHERE product_id = $1', [product_id]);
              await db.none(
                  'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                  [cart.id, product_id, quantity, product.price]
              );
          }
      } else {
          // Chưa đăng nhập: Thêm vào `temporary_cart`
          const session_id = req.sessionID;
          const existingItem = await db.oneOrNone(
              'SELECT * FROM temporary_cart WHERE session_id = $1 AND product_id = $2',
              [session_id, product_id]
          );

          if (existingItem) {
              await db.none(
                  'UPDATE temporary_cart SET quantity = quantity + $1 WHERE id = $2',
                  [quantity, existingItem.id]
              );
          } else {
              const product = await db.one('SELECT * FROM products WHERE product_id = $1', [product_id]);
              await db.none(
                  'INSERT INTO temporary_cart (session_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                  [session_id, product_id, quantity, product.price]
              );
          }
      }

      res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng.' });
  } catch (error) {
      console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
  }
});

// Lấy số lượng sản phẩm trong giỏ hàng
router.get('/cart/items-count', async (req, res) => {
  try {
    if (req.session?.user_id) {
      // Người dùng đã đăng nhập: Tính số lượng sản phẩm từ cart_items
      const user_id = req.session.user_id;
      const totalItems = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM cart_items 
         WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
        [user_id]
      );

      return res.json({ totalItems: totalItems?.total || 0 });
    } else {
      // Người dùng chưa đăng nhập: Tính số lượng sản phẩm từ temporary_cart
      console.log('Session ID during items-count:', req.sessionID);

      const session_id = req.sessionID;
      const totalItems = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM temporary_cart 
         WHERE session_id = $1`,
        [session_id]
      );

      console.log('Total items in temporary_cart:', totalItems?.total || 0);
      return res.json({ totalItems: totalItems?.total || 0 });
    }
  } catch (err) {
    console.error('Lỗi khi lấy số lượng sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi khi lấy số lượng sản phẩm.' });
  }
});

// Hiển thị giỏ hàng
router.get('/cart', async (req, res) => {
  try {
      if (req.session?.user_id) {
          // Đã đăng nhập: Lấy giỏ hàng từ `cart_items`
          const user_id = req.session.user_id;
          const cart = await db.oneOrNone('SELECT * FROM cart WHERE user_id = $1', [user_id]);

          if (!cart) {
              return res.render('customerViews/cart', { items: [], total: 0 });
          }

          const items = await db.any(
              `SELECT ci.id, p.product_name, ci.quantity, ci.price, 
                      (ci.quantity * ci.price) AS total
               FROM cart_items ci
               JOIN products p ON ci.product_id = p.product_id
               WHERE ci.cart_id = $1`,
              [cart.id]
          );

          const total = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
          return res.render('customerViews/cart', { items, total });
      } else {
          // Chưa đăng nhập: Lấy giỏ hàng từ `temporary_cart`
          console.log('Session ID during get cart:', req.sessionID);
          const session_id = req.sessionID;
          console.log('Lấy giỏ hàng tạm thời với session_id:', session_id);

          const items = await db.any(
              `SELECT tc.id, p.product_name, tc.quantity, tc.price, 
                      (tc.quantity * tc.price) AS total
               FROM temporary_cart tc
               JOIN products p ON tc.product_id = p.product_id
               WHERE tc.session_id = $1`,
              [session_id]
          );
          console.log('Sản phẩm trong giỏ hàng tạm:', items);

          const total = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
          return res.render('customerViews/cart', { items, total });
      }
  } catch (err) {
      console.error('Lỗi khi hiển thị giỏ hàng:', err);
      res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', async (req, res) => {
  const { id } = req.body; // Nhận id từ client
  console.log('ID cần xóa:', id);

  try {
    if (!id) {
      console.log('ID không được truyền từ client.');
      return res.status(400).json({ message: 'ID là bắt buộc.' });
    }

    if (req.session?.user_id) {
      // Người dùng đã đăng nhập - Xóa từ database
      await db.none(
        'DELETE FROM cart_items WHERE id = $1 AND cart_id = (SELECT id FROM cart WHERE user_id = $2)',
        [id, req.session.user_id]
      );
      return res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
    } else {
      // Người dùng chưa đăng nhập - Xóa từ session cart
      const sessionCart = req.session.cart || [];
      console.log('Giỏ hàng trước khi xóa:', JSON.stringify(sessionCart, null, 2));

      const initialLength = sessionCart.length;
      req.session.cart = sessionCart.filter(item => item.id !== parseInt(id, 10)); // Tìm và xóa bằng id

      if (req.session.cart.length < initialLength) {
        console.log('Giỏ hàng sau khi xóa:', JSON.stringify(req.session.cart, null, 2));
        return res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
      } else {
        console.log('Không tìm thấy sản phẩm cần xóa:', id);
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
      }
    }
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

module.exports = router;
