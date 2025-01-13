const express = require('express')
const router = express.Router()
const { renderHome } = require('../controllers/homeControllers')

// Route trang chủ
router.get('/', renderHome)

module.exports = router
