const cartModel = require('../../models/authModels/cartModel');

// Gọi hàm addToCart từ model
exports.addToCart = async (req, res) => {
  try {
    await cartModel.addToCart(req, res);
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm vào giỏ hàng.' });
  }
};

// Lấy số lượng sản phẩm trong giỏ hàng
exports.getItemsCount = async (req, res) => {
  try {
    await cartModel.getItemsCount(req, res);
  } catch (error) {
    console.error('Lỗi khi lấy số lượng sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng sản phẩm.' });
  }
};

// Hiển thị giỏ hàng
exports.viewCart = async (req, res) => {
  try {
    await cartModel.viewCart(req, res);
  } catch (error) {
    console.error('Lỗi khi hiển thị giỏ hàng:', error);
    res.status(500).send('Lỗi khi hiển thị giỏ hàng.');
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeItem = async (req, res) => {
  try {
    await cartModel.removeItem(req, res);
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng.' });
  }
};

// Thanh toán
exports.processPayment = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      // Kiểm tra đăng nhập trước
      req.flash('error', 'Yêu cầu bạn đăng nhập để thanh toán');
      return res.redirect('/login');
    }
    await cartModel.processPayment(req, res);
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi yêu cầu thanh toán.' });
  }
};
