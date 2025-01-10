const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');
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
      res.render('customerViews/categoriesAndProducts', { categories, products , message: req.query.message });
  } catch (err) {
      console.error('Lỗi khi tải danh mục và sản phẩm:', err);
      res.status(500).send('Lỗi khi tải dữ liệu trang chủ');
  }
});

// Lấy danh sách danh mục và sản phẩm
router.get('/user', async (req, res) => {
  try {
     const role = req.session.role;

      // Lấy tất cả dữ liệu từ bảng "temporary_cart"
      const getTemporary = await db.query('SELECT * FROM "temporary_cart"');
      const temporaryData = getTemporary 
      //console.log("Tam: ",temporaryData);

        // Thêm từng bản ghi vào bảng "cart"
      for (const temp of temporaryData) {
            const user_id_ = req.session.user_id;
          // Thêm dữ liệu vào bảng "cart"
          const cartResult = await db.query(
            'INSERT INTO "cart" (user_id, session_id) VALUES ($1, $2) RETURNING id',
            [user_id_, temp.session_id]
          );
      const cardd = await db.query('SELECT id FROM cart WHERE user_id=$1 ORDER BY id DESC LIMIT 1', [user_id_]);

        //console.log("card: ", cardd);  // In ra toàn bộ đối tượng cardd
        //console.log("cardd: ", cardd[0].id); //
        const card_id = parseInt(cardd[0].id);
          // Thêm sản phẩm từ temporary_cart vào "cart_items"
          await db.query(
            'INSERT INTO "cart_items" (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [card_id, temp.product_id, temp.quantity, temp.price]
          );
      }
        const deleteTemporate =db.query('DELETE FROM "temporary_cart"');

      const categories = await db.any('SELECT * FROM "categories"');
      const products = await db.any(`
          SELECT p.*, c.name AS category_name 
          FROM "products" p
          INNER JOIN "categories" c ON p.category_id = c.id
      `);
    if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
      // Thêm kiểm tra nếu chưa đăng nhập
    const isLoggedIn = !!req.session.user_id; // true nếu đã đăng nhập


      res.render('customerViews/categoriesAndProducts', { categories, products, isLoggedIn,role });
  } catch (err) {
      console.error('Lỗi khi tải danh mục và sản phẩm:', err);
      res.status(500).send('Lỗi khi tải danh mục và sản phẩm');
  }
});


// Lấy sản phẩm theo danh mục
router.get('/user/:id/products', async (req, res) => {
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

module.exports = router;