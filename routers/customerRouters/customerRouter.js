const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

// Middleware kiểm tra người dùng đã đăng nhập
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user_id) {
    return next();
  }
  return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
}
// Route chính (trang chủ)
router.get('/', async (req, res) => {
  try {
      const categories = await db.any('SELECT * FROM "categories"');
      const products = await db.any(`
          SELECT p.*, c.name AS category_name 
          FROM "products" p
          INNER JOIN "categories" c ON p.category_id = c.id
      `);

      // Render trang chính với danh mục và sản phẩm
      res.render('customerViews/categoriesAndProducts', { categories, products });
  } catch (err) {
      console.error('Lỗi khi tải danh mục và sản phẩm:', err);
      res.status(500).send('Lỗi khi tải dữ liệu trang chủ');
  }
});

// Lấy danh sách danh mục và sản phẩm
router.get('/categories', async (req, res) => {
  try {
      const categories = await db.any('SELECT * FROM "categories"');
      const products = await db.any(`
          SELECT p.*, c.name AS category_name 
          FROM "products" p
          INNER JOIN "categories" c ON p.category_id = c.id
      `);

      // Thêm kiểm tra nếu chưa đăng nhập
      const isLoggedIn = !!req.session.user_id; // true nếu đã đăng nhập

      res.render('customerViews/categoriesAndProducts', { categories, products, isLoggedIn });
  } catch (err) {
      console.error('Lỗi khi tải danh mục và sản phẩm:', err);
      res.status(500).send('Lỗi khi tải danh mục và sản phẩm');
  }
});


// Lấy sản phẩm theo danh mục
router.get('/categories/:id/products', async (req, res) => {
  const categoryId = req.params.id;
  try {
      const products = await db.any('SELECT * FROM products WHERE category_id = $1', [categoryId]);
      const category = await db.oneOrNone('SELECT * FROM categories WHERE id = $1', [categoryId]);

      // Thêm kiểm tra nếu chưa đăng nhập
      const isLoggedIn = !!req.session.user_id;

      if (category) {
          res.render('customerViews/productsByCategory', { products, category, isLoggedIn });
      } else {
          res.status(404).send('Danh mục không tồn tại');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi khi lấy sản phẩm');
  }
});


// Lấy chi tiết sản phẩm
router.get('/product/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await db.oneOrNone('SELECT * FROM "products" WHERE "product_id" = $1', [productId]);

    if (product) {
      res.render('customerViews/productDetail', { product });
    } else {
      res.status(404).send('Sản phẩm không tồn tại');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi lấy chi tiết sản phẩm');
  }
});

// Tìm kiếm sản phẩm
router.get('/search', async (req, res) => {
  const query = req.query.q;
  try {
    const products = await db.any(
      `SELECT * FROM "products" WHERE LOWER("product_name") LIKE LOWER($1)`,
      [`%${query}%`]
    );

    res.render('customerViews/searchResults', { products, query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi tìm kiếm sản phẩm');
  }
});

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

    res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
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
      `SELECT ci.id, p.product_name, ci.quantity, ci.price, (ci.quantity * ci.price) AS total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = $1`,
      [cart.id]
    );

    const total = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);


    res.render('customerViews/cart', { items, total });
    console.log('Items:', items);
console.log('Total:', total);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
});

module.exports = router;
