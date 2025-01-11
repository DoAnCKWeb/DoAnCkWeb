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
      const user_id = req.session.user_id;

      // Lấy giỏ hàng gần nhất của user (nếu có)
      let cart = await db.oneOrNone(
        'SELECT id FROM cart WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user_id]
      );

      if (!cart) {
        // Nếu chưa có giỏ hàng, tạo giỏ hàng mới
        cart = await db.one(
          'INSERT INTO cart (user_id, session_id) VALUES ($1, $2) RETURNING id',
          [user_id, req.sessionID]
        );
      }

      const cart_id = cart.id;

      // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng này chưa
      const existingItem = await db.oneOrNone(
        'SELECT id FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart_id, product_id]
      );

      if (existingItem) {
        // Nếu đã tồn tại, cập nhật số lượng
        await db.none(
          'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingItem.id]
        );
      } else {
        // Nếu chưa tồn tại, thêm sản phẩm mới
        const product = await db.one('SELECT price FROM products WHERE product_id = $1', [product_id]);
        await db.none(
          'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [cart_id, product_id, quantity, product.price]
        );
      }
    } else {
      // Chưa đăng nhập: Thêm vào `temporary_cart`
      const session_id = req.sessionID;
      const existingItem = await db.oneOrNone(
        'SELECT id FROM temporary_cart WHERE session_id = $1 AND product_id = $2',
        [session_id, product_id]
      );

      if (existingItem) {
        // Nếu đã tồn tại, cập nhật số lượng
        await db.none(
          'UPDATE temporary_cart SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingItem.id]
        );
      } else {
        // Nếu chưa tồn tại, thêm sản phẩm mới
        const product = await db.one('SELECT price FROM products WHERE product_id = $1', [product_id]);
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
   FROM "cart_items"
   WHERE "cart_id" IN (SELECT "id" FROM "cart" WHERE "user_id" = $1)`,
  [user_id]
);

console.log('Total Items:', totalItems ? totalItems.total : 0);


      return res.json({ totalItems: totalItems?.total || 0 });
    } else {
      // Người dùng chưa đăng nhập: Tính số lượng sản phẩm từ temporary_cart
      //console.log('Session ID during items-count:', req.sessionID);

      const session_id = req.sessionID;
      const totalItems = await db.oneOrNone(
        `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM temporary_cart 
         WHERE session_id = $1`,
        [session_id]
      );

      //console.log('Total items in temporary_cart:', totalItems?.total || 0);
      return res.json({ totalItems: totalItems?.total || 0 });
    }
  } catch (err) {
    console.error('Lỗi khi lấy số lượng sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi khi lấy số lượng sản phẩm.' });
  }
});
//Hiển thị giỏ hàng
router.get('/cart', async (req, res) => {
  try {
    let items = [];
    let total = 0;

    if (req.session?.user_id) {
      const user_id = req.session.user_id;

      // Lấy sản phẩm từ giỏ hàng
      // items = await db.any(
      //   `SELECT ci.id, p.product_name, p.storage_capacity, p.image, ci.quantity, ci.price, 
      //           (ci.quantity * ci.price) AS sum_price
      //    FROM cart_items ci
      //    JOIN products p ON ci.product_id = p.product_id
      //    JOIN cart c ON ci.cart_id = c.id
      //    WHERE c.user_id = $1`,
      //   [user_id]
      // );
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
   GROUP BY ci.product_id, p.product_name, p.storage_capacity, p.image, ci.price`,
  [user_id]
);

    } else {
      const session_id = req.sessionID;

      // Lấy sản phẩm từ giỏ hàng tạm thời
      items = await db.any(
        `SELECT tc.id, p.product_id, p.product_name, p.storage_capacity, p.image, tc.quantity, tc.price, 
                (tc.quantity * tc.price) AS sum_price
         FROM temporary_cart tc
         JOIN products p ON tc.product_id = p.product_id
         WHERE tc.session_id = $1`,
        [session_id]
      );      
    }

    // Tính tổng tiền
    total = items.reduce((sum, item) => sum + parseFloat(item.sum_price || 0), 0);
    const role = req.session.role;
    console.log(items);
    console.log(total);

    res.render('customerViews/cart', { items, total,role });
  } catch (error) {
    console.error('Lỗi khi hiển thị giỏ hàng:', error);
    res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove', async (req, res) => {
  const { id } = req.body;
  console.log(id);

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
