const express = require('express')
const router = express.Router()
router.get('/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login'); // Nếu chưa đăng nhập, chuyển đến trang login
  }
  const role = req.session.role

  res.render('customerViews/customerViews', { user: req.user,role })
})
module.exports = router
