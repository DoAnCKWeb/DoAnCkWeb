const customerModel = require('../../models/authModels/customerModel');

// Trang chủ
exports.homePage = async (req, res) => {
  try {
    await customerModel.homePage(req, res);
  } catch (err) {
    console.error('Lỗi khi tải danh mục và sản phẩm:', err);
    res.status(500).send('Lỗi khi tải dữ liệu trang chủ');
  }
};

// Lấy danh sách danh mục và sản phẩm (user)
exports.userCategories = async (req, res) => {
  try {
    await customerModel.userCategories(req, res);
  } catch (err) {
    console.error('Lỗi khi tải danh mục và sản phẩm:', err);
    res.status(500).send('Lỗi khi tải danh mục và sản phẩm');
  }
};

// Lấy sản phẩm theo danh mục
exports.productsByCategory = async (req, res) => {
  try {
    await customerModel.productsByCategory(req, res);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).send('Lỗi khi lấy sản phẩm');
  }
};

// Lấy chi tiết sản phẩm
exports.productDetail = async (req, res) => {
  try {
    await customerModel.productDetail(req, res);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).send('Lỗi khi lấy chi tiết sản phẩm');
  }
};

// Tìm kiếm sản phẩm
exports.searchProduct = async (req, res) => {
  try {
    await customerModel.searchProduct(req, res);
  } catch (err) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', err);
    res.status(500).send('Lỗi khi tìm kiếm sản phẩm');
  }
};

// Lọc & Phân trang sản phẩm
exports.filterProducts = async (req, res) => {
  try {
    await customerModel.filterProducts(req, res);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).send('Lỗi khi lấy sản phẩm');
  }
};
