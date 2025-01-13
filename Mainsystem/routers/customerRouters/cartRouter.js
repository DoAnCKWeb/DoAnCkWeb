const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/customerControllers/cartController');

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', cartController.addToCart);

// Lấy số lượng sản phẩm trong giỏ hàng
router.get('/cart/items-count', cartController.getItemsCount);

// Hiển thị giỏ hàng
router.get('/cart', cartController.viewCart);
router.post('/cart/remove', cartController.removeItem);

// Thanh toán
router.post('/payment/:ids', cartController.processPayment);

module.exports = router;
