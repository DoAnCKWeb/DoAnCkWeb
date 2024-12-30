const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'product_id và quantity là bắt buộc.' });
    }

    if (req.session?.user_id) {
      // Người dùng đã đăng nhập
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
      // Người dùng chưa đăng nhập
      req.session.cart = req.session.cart || [];
      const existingItem = req.session.cart.find(item => item.product_id === product_id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        const product = await db.one('SELECT * FROM products WHERE product_id = $1', [product_id]);
        req.session.cart.push({
          product_id,
          quantity,
          price: product.price,
          name: product.product_name,
        });
      }
    }

    res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng.' });
  } catch (err) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
  }
});

// Lấy số lượng sản phẩm trong giỏ hàng
router.get('/cart/items-count', async (req, res) => {
  try {
    if (req.session?.user_id) {
      const user_id = req.session.user_id;
      const totalItems = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM cart_items 
         WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
        [user_id]
      );

      return res.json({ totalItems: totalItems?.total || 0 });
    } else {
      const sessionCart = req.session.cart || [];
      const totalItems = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
      return res.json({ totalItems });
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
      const sessionCart = req.session.cart || [];
      const items = sessionCart.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      const total = items.reduce((sum, item) => sum + item.total, 0);
      res.render('customerViews/cart', { items, total });
    }
  } catch (err) {
    console.error('Lỗi khi hiển thị giỏ hàng:', err);
    res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', async (req, res) => {
  const { product_id } = req.body;

  try {
    if (!product_id) {
      console.log('product_id không được truyền từ client.');
      return res.status(400).json({ message: 'product_id là bắt buộc.' });
    }

    console.log('Xóa sản phẩm khỏi giỏ hàng:', product_id);

    if (req.session?.user_id) {
      const user_id = req.session.user_id;
      console.log('Người dùng đã đăng nhập. User ID:', user_id);

      await db.none(
        'DELETE FROM cart_items WHERE product_id = $1 AND cart_id = (SELECT id FROM cart WHERE user_id = $2)',
        [product_id, user_id]
      );

      console.log(`Đã xóa sản phẩm (product_id: ${product_id}) khỏi giỏ hàng.`);
      res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
    } else {
      let sessionCart = req.session.cart || [];
      console.log('Giỏ hàng ban đầu:', sessionCart);

      const initialLength = sessionCart.length;
      sessionCart = sessionCart.filter(item => item.product_id !== product_id);
      req.session.cart = sessionCart;

      console.log('Giỏ hàng sau khi xóa:', sessionCart);

      if (sessionCart.length < initialLength) {
        console.log(`Đã xóa sản phẩm (product_id: ${product_id}) khỏi giỏ hàng trong session.`);
        res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
      } else {
        console.log(`Không tìm thấy sản phẩm (product_id: ${product_id}) trong giỏ hàng.`);
        res.json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
      }
    }
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

module.exports = router;
