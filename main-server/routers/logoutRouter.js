const express = require('express')
const router = express.Router()
const { logout } = require('../controllers/logoutControllers')

// Đăng xuất
router.get('/logout', logout)

module.exports = router
