const express = require('express');
const router = express.Router();
const db = require('../../models/connectDatabase');
// Middleware kiểm tra đăng nhập
function isAuthenticated(req, res, next) {
  if (req.session?.user_id) {
      return next();
  }
  res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
}

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.session.user_id;

  try {
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

      const totalItems = await db.one('SELECT SUM(quantity) AS total FROM cart_items WHERE cart_id = $1', [cart.id]);
      res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng.', totalItems: totalItems.total });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
  }
});

// Lấy số lượng sản phẩm trong giỏ hàng
router.get('/cart/items-count', async (req, res) => {
  try {
      const user_id = req.session?.user_id;
      if (!user_id) {
          return res.json({ totalItems: 0 }); // Nếu không đăng nhập
      }

      const totalItems = await db.oneOrNone(
          `SELECT COALESCE(SUM(quantity), 0) AS total 
          FROM cart_items 
          WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
          [user_id]
      );

      res.json({ totalItems: totalItems?.total || 0 });
  } catch (err) {
      console.error('Lỗi khi lấy số lượng sản phẩm:', err);
      res.status(500).json({ message: 'Lỗi khi lấy số lượng sản phẩm trong giỏ hàng.' });
  }
});


// Hiển thị giỏ hàng
router.get('/cart', isAuthenticated, async (req, res) => {
  const user_id = req.session.user_id;

  try {
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
    res.render('customerViews/cart', { items, total });
  } catch (err) {
    console.error('Lỗi khi hiển thị giỏ hàng:', err);
    res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', isAuthenticated, async (req, res) => {
  const { item_id } = req.body;

  try {
    await db.none('DELETE FROM cart_items WHERE id = $1', [item_id]);
    res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});



module.exports = router;
