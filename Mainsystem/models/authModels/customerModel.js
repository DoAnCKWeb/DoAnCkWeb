const { db } = require('../../models/connectDatabase');

exports.homePage = async (req, res) => {
  const role = req.session.role;
  const { page = 1, limit = 6 } = req.query;
  const offset = (page - 1) * limit;

  const categories = await db.any('SELECT * FROM "categories" ORDER BY id ASC');
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
    role
  });
};

exports.userCategories = async (req, res) => {
  const role = req.session.role;

  // Lấy tất cả dữ liệu từ bảng "temporary_cart"
  const getTemporary = await db.query('SELECT * FROM "temporary_cart"');
  const temporaryData = getTemporary;

  // Thêm từng bản ghi vào bảng "cart"
  for (const temp of temporaryData) {
    const user_id_ = req.session.user_id;
    // Thêm dữ liệu vào bảng "cart"
    const cartResult = await db.query(
      'INSERT INTO "cart" (user_id, session_id) VALUES ($1, $2) RETURNING id',
      [user_id_, temp.session_id]
    );
    const cardd = await db.query('SELECT id FROM cart WHERE user_id=$1 ORDER BY id DESC LIMIT 1', [user_id_]);
    const card_id = parseInt(cardd[0].id);

    // Thêm sản phẩm từ temporary_cart vào "cart_items"
    await db.query(
      'INSERT INTO "cart_items" (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
      [card_id, temp.product_id, temp.quantity, temp.price]
    );
  }
  // Xóa toàn bộ temporary_cart
  await db.query('DELETE FROM "temporary_cart"');

  const { page = 1, limit = 6 } = req.query;
  const offset = (page - 1) * limit;

  const categories = await db.any('SELECT * FROM "categories" ORDER BY id ASC');
  const products = await db.any(
    `SELECT p.*, c.name AS category_name 
     FROM "products" p
     INNER JOIN "categories" c ON p.category_id = c.id
     ORDER BY p.product_id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const totalProducts = await db.one('SELECT COUNT(*) FROM "products"', [], a => +a.count);
  const totalPages = Math.ceil(totalProducts / limit);

  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  const isLoggedIn = !!req.session.user_id;

  res.render('customerViews/categoriesAndProducts', {
    categories,
    products,
    currentPage: parseInt(page, 10),
    totalPages,
    isLoggedIn,
    role,
  });
};

exports.productsByCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { page = 1, limit = 6 } = req.query;
  const offset = (page - 1) * limit;
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
      currentPage: parseInt(page, 10),
      role
    });
  } else {
    res.status(404).send('Danh mục không tồn tại');
  }
};

exports.productDetail = async (req, res) => {
  const productId = req.params.id;

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
     LIMIT 8`,
    [product.category_id, productId]
  );

  // Chia thành các chunks
  const relatedProductsChunks = [];
  for (let i = 0; i < relatedProducts.length; i += 4) {
    relatedProductsChunks.push(relatedProducts.slice(i, i + 4));
  }

  // Render view và truyền dữ liệu
  res.render('customerViews/productDetail', {
    product,
    relatedProductsChunks,
  });
};

exports.searchProduct = async (req, res) => {
    const query = req.query.q;
    const role = req.session.role;
    const { page = 1, limit = 8 } = req.query; // Mặc định mỗi trang 6 sản phẩm
    const offset = (page - 1) * limit;
  
    // Lấy sản phẩm phù hợp với tìm kiếm và áp dụng phân trang
    const products = await db.any(
      `SELECT * FROM "products" 
       WHERE LOWER("product_name") LIKE LOWER($1) 
       ORDER BY product_id ASC 
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit, offset]
    );
  
    // Tính tổng số sản phẩm khớp với từ khóa tìm kiếm
    const totalProducts = await db.one(
      `SELECT COUNT(*) 
       FROM "products" 
       WHERE LOWER("product_name") LIKE LOWER($1)`,
      [`%${query}%`],
      (a) => +a.count
    );
  
    const totalPages = Math.ceil(totalProducts / limit);
  
    // Render kết quả tìm kiếm
    res.render('customerViews/searchResults', {
      products,
      query,
      role,
      currentPage: parseInt(page, 10),
      totalPages,
    });
  };
  

exports.filterProducts = async (req, res) => {
  const { category = 'all', page = 1, limit = 6, minPrice, maxPrice, storage, priceSort, releaseYear, os } = req.query;
  const offset = (page - 1) * limit;

  // Xây dựng câu lệnh SQL
  let query = `SELECT p.*, c.name AS category_name
               FROM "products" p
               INNER JOIN "categories" c ON p.category_id = c.id
               WHERE 1 = 1`;
  let params = [];

  if (category !== 'all') {
    query += ' AND p.category_id = $' + (params.length + 1);
    params.push(category);
  }

  if (minPrice) {
    query += ' AND p.price >= $' + (params.length + 1);
    params.push(minPrice);
  }

  if (maxPrice) {
    query += ' AND p.price <= $' + (params.length + 1);
    params.push(maxPrice);
  }

  if (storage) {
    query += ' AND p.storage_capacity = $' + (params.length + 1);
    params.push(storage);
  }

  if (releaseYear) {
    query += ' AND p.release_year = $' + (params.length + 1);
    params.push(releaseYear);
  }

  if (os) {
    query += ' AND p.operating_system = $' + (params.length + 1);
    params.push(os);
  }

  if (priceSort) {
    query += priceSort === 'asc' ? ' ORDER BY p.price ASC' : ' ORDER BY p.price DESC';
  } else {
    query += ' ORDER BY p.product_id ASC';
  }

  query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  // Lấy các sản phẩm theo bộ lọc
  const products = await db.any(query, params);

  // Tạo câu lệnh count cho phân trang
  let countQuery = 'SELECT COUNT(*) FROM "products" p WHERE 1 = 1';
  const paramCopy = []; // Copy mảng params cho chính xác
  let index = 0;

  // Ta phải phân tích lại các bước thêm điều kiện vào countQuery, giống hệt trên
  if (category !== 'all') {
    countQuery += ' AND p.category_id = $' + (++index);
    paramCopy.push(category);
  }
  if (minPrice) {
    countQuery += ' AND p.price >= $' + (++index);
    paramCopy.push(minPrice);
  }
  if (maxPrice) {
    countQuery += ' AND p.price <= $' + (++index);
    paramCopy.push(maxPrice);
  }
  if (storage) {
    countQuery += ' AND p.storage_capacity = $' + (++index);
    paramCopy.push(storage);
  }
  if (releaseYear) {
    countQuery += ' AND p.release_year = $' + (++index);
    paramCopy.push(releaseYear);
  }
  if (os) {
    countQuery += ' AND p.operating_system = $' + (++index);
    paramCopy.push(os);
  }

  const totalProducts = await db.one(countQuery, paramCopy, a => +a.count);
  const totalPages = Math.ceil(totalProducts / limit);

  res.json({
    products,
    currentPage: parseInt(page, 10),
    totalPages
  });
};
