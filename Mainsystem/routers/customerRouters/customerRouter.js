const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase');

router.get('/', async (req, res) => {
  try {
    const role = req.session.role;

    
    const categories = await db.any('SELECT * FROM "categories" ORDER BY id ASC');
    const { page = 1, limit = 6 } = req.query;
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
      totalPages,role
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

    const { page = 1, limit = 6 } = req.query; // Mặc định mỗi trang 8 sản phẩm
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
  const { page = 1, limit = 6 } = req.query; // Mặc định mỗi trang 8 sản phẩm
  const offset = (page - 1) * limit;

  try {
    const role = req.session.role;

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
        currentPage: parseInt(page, 10),role
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
    // Lấy thông tin sản phẩm hiện tại
    const product = await db.oneOrNone(
      `SELECT p.*, c.name AS category_name
       FROM "products" p
       INNER JOIN "categories" c ON p.category_id = c.id
       WHERE p.product_id = $1`,
      [productId]
    );

    if (!product) {
      return res.status(404).send('Sản phẩm không tồn tại');
    }

    // Lấy sản phẩm liên quan (cùng category_id nhưng khác product_id)
    const relatedProducts = await db.any(
      `SELECT p.*, c.name AS category_name
       FROM "products" p
       INNER JOIN "categories" c ON p.category_id = c.id
       WHERE p.category_id = $1 AND p.product_id != $2
       LIMIT 8`, // Giới hạn 8 sản phẩm liên quan
      [product.category_id, productId]
    );

    // Chia sản phẩm liên quan thành các "chunks" (mỗi chunk là 4 sản phẩm)
    const relatedProductsChunks = [];
    for (let i = 0; i < relatedProducts.length; i += 4) {
      relatedProductsChunks.push(relatedProducts.slice(i, i + 4));
    }

    // Render view và truyền dữ liệu
    res.render('customerViews/productDetail', {
      product,
      relatedProductsChunks,
    });
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
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

router.get('/products', async (req, res) => {
  const { category = 'all', page = 1, limit = 6, minPrice, maxPrice, storage, priceSort, releaseYear, os } = req.query;
  const offset = (page - 1) * limit;

  // Bắt đầu xây dựng câu lệnh SQL cho việc lấy sản phẩm
  let query = `SELECT p.*, c.name AS category_name
               FROM "products" p
               INNER JOIN "categories" c ON p.category_id = c.id
               WHERE 1 = 1`;  // Điều kiện mặc định cho tất cả các bộ lọc
  let params = [];

  // Lọc theo danh mục
  if (category !== 'all') {
    query += ' AND p.category_id = $' + (params.length + 1);
    params.push(category);
  }

  // Lọc theo giá
  if (minPrice) {
    query += ' AND p.price >= $' + (params.length + 1);
    params.push(minPrice);
  }

  if (maxPrice) {
    query += ' AND p.price <= $' + (params.length + 1);
    params.push(maxPrice);
  }

  // Lọc theo dung lượng
  if (storage) {
    query += ' AND p.storage_capacity = $' + (params.length + 1);
    params.push(storage);
  }

  // Lọc theo năm sản xuất
  if (releaseYear) {
    query += ' AND p.release_year = $' + (params.length + 1);
    params.push(releaseYear);
  }

  // Lọc theo hệ điều hành
  if (os) {
    query += ' AND p.operating_system = $' + (params.length + 1);
    params.push(os);
  }

  // Lọc theo giá (sắp xếp từ cao đến thấp hoặc thấp đến cao)
  if (priceSort) {
    if (priceSort === 'asc') {
      query += ' ORDER BY p.price ASC';
    } else if (priceSort === 'desc') {
      query += ' ORDER BY p.price DESC';
    }
  } else {
    query += ' ORDER BY p.product_id ASC'; // Mặc định sắp xếp theo ID
  }

  // Phân trang
  query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  try {
    // Lấy các sản phẩm theo bộ lọc
    const products = await db.any(query, params);

    // Lấy tổng số sản phẩm theo các bộ lọc (chú ý là không tính phân trang ở đây)
    let countQuery = 'SELECT COUNT(*) FROM "products" p WHERE 1 = 1';
    
    // Áp dụng các điều kiện lọc giống như truy vấn sản phẩm
    if (category !== 'all') {
      countQuery += ' AND p.category_id = $' + (params.length + 1);
      params.push(category);
    }

    if (minPrice) {
      countQuery += ' AND p.price >= $' + (params.length + 1);
      params.push(minPrice);
    }

    if (maxPrice) {
      countQuery += ' AND p.price <= $' + (params.length + 1);
      params.push(maxPrice);
    }

    if (storage) {
      countQuery += ' AND p.storage_capacity = $' + (params.length + 1);
      params.push(storage);
    }

    if (releaseYear) {
      countQuery += ' AND p.release_year = $' + (params.length + 1);
      params.push(releaseYear);
    }

    if (os) {
      countQuery += ' AND p.operating_system = $' + (params.length + 1);
      params.push(os);
    }

    // Tính tổng số sản phẩm
    const totalProducts = await db.one(countQuery, params, a => +a.count);
    const totalPages = Math.ceil(totalProducts / limit);

    // Trả về các sản phẩm và thông tin phân trang
    res.json({
      products,
      currentPage: parseInt(page, 10),
      totalPages
    });
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).send('Lỗi khi lấy sản phẩm');
  }
});

module.exports = router;
