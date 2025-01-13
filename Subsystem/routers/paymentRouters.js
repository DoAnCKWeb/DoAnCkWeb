const express = require('express')
const router = express.Router()

const {showPaymentViews} = require('../controllers/showPaymentControllers')
router.get('/', showPaymentViews)
// Xử lí thanh toán
const {paymentHandle} = require('../controllers/paymentControllers')
router.post('/payment/process', paymentHandle)
module.exports = router
