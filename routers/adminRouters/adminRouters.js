const express = require('express')
const router = express.Router()
const {showAccounts} = require('../../controllers/adminControllers/accountsControllers/accountsControllers')

// Route Admin: Trang quản trị admin
router.get('/admin', (req, res) => {
  // Kiểm tra nếu người dùng là admin
  if (!req.isAuthenticated()) {
    return res.redirect('/login'); // Nếu chưa đăng nhập, chuyển đến trang login
  }

  res.render('adminViews/adminViews')
})
// Route: Hiển thị danh sách tài khoản
router.get('/admin/accounts', showAccounts)
// Search
const {Search} = require('../../controllers/adminControllers/accountsControllers/searchUserControllers')
router.post('/admin/search', Search)
// addUser
const {addUserController} = require('../../controllers/adminControllers/accountsControllers/addUserControllers')
router.post('/admin/adduser', addUserController)
// delete user
const {deleteUser} = require('../../controllers/adminControllers/accountsControllers/deleteUserControllers')
router.post('/admin/delete/:id', deleteUser)



module.exports = router
