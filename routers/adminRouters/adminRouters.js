const express = require('express')
const router = express.Router()
const {showAccounts} = require('../../controllers/adminControllers/accountsControllers/accountsControllers')
const {renderHome, renderAddProduct, addProductHandler, renderEditProduct, editProductHandler, deleteProductHandler, uploadProductImageHandler, showProductDetail, addCategoryHandler, deleteCategoryHandler} = require('../../controllers/adminControllers/categoriesControllers/categoriesControllers')

// Route Admin: Trang quản trị admin
router.get('/admin', (req, res) => {
  // Kiểm tra nếu người dùng là admin
  if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
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


const { db } = require('../../models/connectDatabase'); // Kết nối database

// Thống kê doanh thu
router.get('/admin/statistics', async (req, res) => {
  try {
      // Query 1: Tỉ lệ doanh thu theo danh mục
      const categoryPercentageQuery = `
          SELECT 
              c.name AS category_name,
              COUNT(DISTINCT o.id) AS total_orders,
              SUM(oi.price) AS total_revenue,
              ROUND((SUM(oi.price) * 100.0 / SUM(SUM(oi.price)) OVER ()), 2) AS percentage_revenue
          FROM 
              order_items oi
          JOIN 
              products p ON oi.product_id = p.product_id
          JOIN 
              categories c ON p.category_id = c.id
          JOIN 
              orders o ON oi.order_id = o.id
          GROUP BY 
              c.name
          ORDER BY 
              percentage_revenue DESC;
      `;
      const categoryPercentages = await db.any(categoryPercentageQuery);

      // Query 2: Top 3 sản phẩm theo doanh thu trong từng danh mục
      const topProductsQuery = `
          WITH category_product_revenue AS (
              SELECT 
                  c.name AS category_name,
                  p.product_name,
                  SUM(oi.price) AS total_revenue
              FROM 
                  order_items oi
              JOIN 
                  products p ON oi.product_id = p.product_id
              JOIN 
                  categories c ON p.category_id = c.id
              GROUP BY 
                  c.name, p.product_name
          ),
          ranked_products AS (
              SELECT 
                  category_name,
                  product_name,
                  total_revenue,
                  RANK() OVER (PARTITION BY category_name ORDER BY total_revenue DESC) AS rank
              FROM 
                  category_product_revenue
          )
          SELECT 
              category_name,
              product_name,
              total_revenue
          FROM 
              ranked_products
          WHERE 
              rank <= 3;
      `;
      const topProducts = await db.any(topProductsQuery);

      // Dữ liệu cho biểu đồ 1: Tỉ lệ doanh thu
      const categories = categoryPercentages.map(row => row.category_name);
      const revenues = categoryPercentages.map(row => row.percentage_revenue);

      // Dữ liệu cho biểu đồ 2: Top sản phẩm theo doanh thu
      const productLabels = topProducts.map(product => `${product.category_name} - ${product.product_name}`);
      const productRevenues = topProducts.map(product => product.total_revenue);

      res.render('adminViews/statistics', {
          categories: JSON.stringify(categories),
          revenues: JSON.stringify(revenues),
          topProducts: JSON.stringify(topProducts), // Truyền topProducts
      });
  } catch (error) {
      console.error('Lỗi khi truy vấn dữ liệu:', error);
      res.status(500).send('Lỗi server!');
  }
});

module.exports = router;
