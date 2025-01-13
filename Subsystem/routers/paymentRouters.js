const express = require('express')
const router = express.Router()

// Route Admin: Trang quản trị admin
router.get('/', (req, res) => {
  // Kiểm tra nếu người dùng là admin
  res.render('layouts/main')
})
//Xử lí thanh toán
const {paymentHandle} = require('../controllers/paymentControllers')
router.post('/payment/process', paymentHandle)
module.exports = router;
