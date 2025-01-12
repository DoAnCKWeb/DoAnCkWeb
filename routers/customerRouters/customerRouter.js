const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

router.get('/', async (req, res) => {
  try {
    
    const categories = await db.any('SELECT * FROM "categories" ORDER BY id ASC');
    const { page = 1, limit = 8 } = req.query;
    const offset = (page - 1) * limit;

    const totalProducts = await db.one('SELECT COUNT(*) FROM "products"', [], a => +a.count);

    const products = await db.any(
      `SELECT p.*, c.name AS category_name
       FROM "products" p
       INNER JOIN "categories" c ON p.category_id = c.id
       ORDER BY p.product_id ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(totalProducts / limit);

    res.render('customerViews/categoriesAndProducts', {
      categories,
      products,
      currentPage: parseInt(page, 10),
      totalPages,
    });
  } catch (err) {
    console.error('Lỗi khi tải danh mục và sản phẩm:', err);
    res.status(500).send('Lỗi khi tải dữ liệu trang chủ');
  }
});


// Lấy danh sách danh mục và sản phẩm
router.get('/user', async (req, res) => {
  try {
    const role = req.session.role;
    const { page = 1, limit = 8 } = req.query; // Mặc định mỗi trang 8 sản phẩm
    const offset = (page - 1) * limit;

    const categories = await db.any('SELECT * FROM "categories" ORDER BY id ASC');

    // Lấy sản phẩm cho trang hiện tại
    const products = await db.any(
      `SELECT p.*, c.name AS category_name 
       FROM "products" p
       INNER JOIN "categories" c ON p.category_id = c.id
       ORDER BY p.product_id ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Tính tổng số sản phẩm
    const totalProducts = await db.one('SELECT COUNT(*) FROM "products"', [], a => +a.count);
    const totalPages = Math.ceil(totalProducts / limit);

    if (!req.isAuthenticated()) {
      return res.redirect('/login'); 
    }

    const isLoggedIn = !!req.session.user_id; // true nếu đã đăng nhập

    res.render('customerViews/categoriesAndProducts', {
      categories,
      products,
      currentPage: parseInt(page, 10),
      totalPages,
      isLoggedIn,
      role,
    });
  } catch (err) {
    console.error('Lỗi khi tải danh mục và sản phẩm:', err);
    res.status(500).send('Lỗi khi tải danh mục và sản phẩm');
  }
});


// Lấy sản phẩm theo danh mục
router.get('/user/:id/products', async (req, res) => {
  const categoryId = req.params.id;
  const { page = 1, limit = 8 } = req.query; // Mặc định mỗi trang 8 sản phẩm
  const offset = (page - 1) * limit;

  try {
    const products = await db.any(
      `SELECT * FROM products WHERE category_id = $1 ORDER BY product_id ASC LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset]
    );
    const category = await db.oneOrNone('SELECT * FROM categories WHERE id = $1', [categoryId]);

    const totalProducts = await db.one(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [categoryId],
      a => +a.count
    );
    const totalPages = Math.ceil(totalProducts / limit);

    if (category) {
      res.render('customerViews/productsByCategory', {
        products,
        category,
        totalPages,
        currentPage: parseInt(page, 10),
      });
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
    const role = req.session.role;

    if (product) {
      res.render('customerViews/productDetail', { product, role });
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
      `SELECT * FROM "products" WHERE LOWER("product_name") LIKE LOWER($1) ORDER BY product_id ASC`,
      [`%${query}%`]
    );
    const role = req.session.role;

    res.render('customerViews/searchResults', { products, query, role });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi tìm kiếm sản phẩm');
  }
});

module.exports = router;
