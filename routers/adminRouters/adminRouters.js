const express = require('express')
const router = express.Router()
const {showAccounts} = require('../../controllers/adminControllers/accountsControllers/accountsControllers')
const {renderHome, renderAddProduct, addProductHandler, renderEditProduct, editProductHandler, deleteProductHandler, uploadProductImageHandler, showProductDetail, addCategoryHandler, deleteCategoryHandler} = require('../../controllers/adminControllers/categoriesControllers/categoriesControllers')

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
// detail user
const {showDetail } = require('../../controllers/adminControllers/accountsControllers/detailControllers')
router.get('/admin/detail/:id', showDetail)
// edit user
const {showEdit, updateUser} = require('../../controllers/adminControllers/accountsControllers/editUserControllers')
router.get('/admin/edit/:id', showEdit)
router.post('/admin/edit/:id', updateUser)

// Categories
router.get('/admin/categories', renderHome); // Trang chủ hiển thị danh sách category và sản phẩm
router.get('/admin/categories/addProduct/:id', renderAddProduct); // Trang thêm sản phẩm cho category
router.post('/admin/categories/addProduct/:id', addProductHandler); // Thêm sản phẩm vào database
router.get('/admin/categories/editProduct/:id', renderEditProduct); // Trang sửa sản phẩm
router.post('/admin/categories/editProduct/:id', editProductHandler); // Sửa sản phẩm trong database
router.post('/admin/categories/deleteProduct/:id', deleteProductHandler); // Xóa sản phẩm khỏi database
router.post('/admin/categories/uploadImage/:id', uploadProductImageHandler); // Upload ảnh

router.get('/admin/categories/product/:id', showProductDetail);
router.post('/admin/categories/addCategory', addCategoryHandler);
router.post('/admin/categories/deleteCategory/:id', deleteCategoryHandler);


// Thống kê doanh thu
router.get('/admin/statistics', (req, res) => {
  const categories = ['Điện thoại', 'Laptop', 'Máy tính bảng', 'Tai nghe', 'Smartwatch']
  const revenues = [500000000, 750000000, 300000000, 150000000, 200000000]
  res.render('adminViews/statistics', {categories: JSON.stringify(categories),revenues: JSON.stringify(revenues)})
})
module.exports = router
