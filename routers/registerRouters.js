const express = require('express')
const router = express.Router()
const  register = require('../controllers/registerControllers')

// Route xử lý đăng ký
router.get('/register', (req, res)=>{
    res.render('register')
})
router.post('/register', register)

module.exports = router
