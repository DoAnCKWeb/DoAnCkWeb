const express = require('express')
const router = express.Router()
const register = require('../controllers/registerControllers')

// Route xử lý đăng ký
router.get('/register', (req, res) => {
  const message = req.query.message
    res.render('register', { message })
})
router.post('/register', register)

module.exports = router
