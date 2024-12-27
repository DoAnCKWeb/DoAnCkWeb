const express = require('express')
const router = express.Router()
const {  renderLogin,login } = require('../controllers/loginControllers')

// Route trang login
router.get('/login', renderLogin); // Hiển thị form login
router.post('/login', login); // Xử lý đăng nhập khi submit form

module.exports = router
