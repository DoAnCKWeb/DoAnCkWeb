const express = require('express')
const router = express.Router()

// Route Admin: Trang quản trị admin
router.get('/', (req, res) => {
  // Kiểm tra nếu người dùng là admin
  res.render('layouts/main')
})
module.exports = router
