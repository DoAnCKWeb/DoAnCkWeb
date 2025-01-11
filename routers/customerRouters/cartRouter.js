const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
      //console.log('Session ID during add to cart:', req.sessionID);

      if (!product_id || !quantity) {
          return res.status(400).json({ message: 'product_id và quantity là bắt buộc.' });
      }

    if (req.session?.user_id) {
      // Người dùng đã đăng nhập - Thêm vào `cart_items`
    // Thêm vào bảng cart
      await db.query('INSERT INTO cart (user_id, session_id) VALUES ($1, $2)', [req.session.user_id, req.sessionID]);

      // Lấy id của cart vừa thêm vào
      const cart_id_ = await db.query('SELECT id FROM cart WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [req.session.user_id]);
      const cart_id = parseInt(cart_id_[0].id); // Lấy id của cart

      // Lấy giá trị price của sản phẩm
      const price = await db.query('SELECT price FROM products WHERE product_id = $1', [product_id]);

      // Thêm vào bảng cart_items
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [cart_id, product_id, quantity, price[0].price]);

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

// Hiển thị giỏ hàng
router.get('/cart', async (req, res) => {
  try {
    if (req.session?.user_id) {
     
        const role = req.session.role;
            // Đã đăng nhập: Lấy giỏ hàng từ `cart_items`
            const user_id = req.session.user_id;
            const cart = await db.query('SELECT * FROM cart WHERE user_id = $1', [user_id]);

            if (!cart) {
                return res.render('customerViews/cart', { items: [], total: 0 });
            }

            const items = await db.any(
            `SELECT p.product_id, p.product_name, SUM(ci.quantity) as quantity , 
                    SUM(ci.quantity * ci.price) AS sum_price ,p.price,COALESCE(SUM(quantity), 0) AS total_quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            JOIN cart c ON c.id = ci.cart_id
            WHERE c.user_id = $1
            GROUP BY p.product_id, p.product_name`,
            [user_id]
          );

        //console.log(items);
        

        //console.log(req.sessionID);
          const total = items.reduce((sum, item) => sum + (parseFloat(item.sum_price) || 0), 0);
          console.log('Total:', total);
          return res.render('customerViews/cart', { items, total, role });
    } else {
          const session_id = req.sessionID;

    // Sửa lại câu truy vấn với GROUP BY đúng
        const items = await db.any(
          `SELECT p.product_name, tc.quantity, tc.price, 
                  SUM(tc.quantity * tc.price) AS sum_price,
                  (tc.quantity * tc.price) AS total
          FROM temporary_cart tc
          JOIN products p ON tc.product_id = p.product_id
          WHERE tc.session_id = $1
          GROUP BY p.product_name, tc.quantity, tc.price`, // Thêm GROUP BY cho p.product_name, tc.quantity, tc.price
          [session_id]
        );

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
      //console.log('ID không được truyền từ client.');
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
      //console.log('Giỏ hàng trước khi xóa:', JSON.stringify(sessionCart, null, 2));

      const initialLength = sessionCart.length;
      req.session.cart = sessionCart.filter(item => item.id !== parseInt(id, 10)); // Tìm và xóa bằng id

      if (req.session.cart.length < initialLength) {
        //console.log('Giỏ hàng sau khi xóa:', JSON.stringify(req.session.cart, null, 2));
        return res.json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
      } else {
        //console.log('Không tìm thấy sản phẩm cần xóa:', id);
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
      }
    }
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

module.exports = router;
