const { db } = require('../models/connectDatabase'); // Kết nối cơ sở dữ liệu

// Hàm lấy danh mục và sản phẩm, render tới categoriesAndProducts.handlebars
const renderHome = async (req, res) => {
    try {
        const categories = await db.any('SELECT * FROM "categories"');
        const products = await db.any(`
            SELECT p.*, c.name AS category_name 
            FROM "products" p
            INNER JOIN "categories" c ON p.category_id = c.id
        `);

        // Render file categoriesAndProducts.handlebars
        res.render('customerViews/categoriesAndProducts', { categories, products });
    } catch (error) {
        console.error('Lỗi khi tải danh mục và sản phẩm:', error);
        res.status(500).send('Lỗi khi tải dữ liệu trang chủ');
    }
};

module.exports = {
    renderHome
};
