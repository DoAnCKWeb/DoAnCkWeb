const express = require('express');
const router = express.Router();
const { db } = require('../../models/connectDatabase'); // Đảm bảo bạn đang lấy đúng đối tượng `db`

// Lấy danh sách danh mục và sản phẩm
router.get('/categories', async (req, res) => {
    try {
        const categories = await db.any('SELECT * FROM "categories"');
        const products = await db.any(`
            SELECT p.*, c.name AS category_name 
            FROM "products" p
            INNER JOIN "categories" c ON p.category_id = c.id
        `);

        res.render('customerViews/categoriesAndProducts', { categories, products });
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

        if (category) {
            res.render('customerViews/productsByCategory', { products, category });
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
router.get('/search', async (req, res) => {
    const query = req.query.q; // Lấy từ khóa từ URL
    try {
        const products = await db.any(
            `SELECT * FROM "products" WHERE LOWER("product_name") LIKE LOWER($1)`,
            [`%${query}%`] // Tìm kiếm không phân biệt hoa thường
        );

        res.render('customerViews/searchResults', { products, query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tìm kiếm sản phẩm');
    }
});


module.exports = router;
