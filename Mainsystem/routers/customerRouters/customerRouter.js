const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customerControllers/customerControllers');

// Trang chủ
router.get('/', customerController.homePage);

// Lấy danh sách danh mục và sản phẩm
router.get('/user', customerController.userCategories);

// Lấy sản phẩm theo danh mục
router.get('/user/:id/products', customerController.productsByCategory);

// Lấy chi tiết sản phẩm
router.get('/product/:id', customerController.productDetail);

// Tìm kiếm sản phẩm
router.get('/search', customerController.searchProduct);

// Lọc & Phân trang sản phẩm
router.get('/products', customerController.filterProducts);

module.exports = router;
