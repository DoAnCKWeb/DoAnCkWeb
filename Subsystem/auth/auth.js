const jwt = require('jsonwebtoken')

// Mã bí mật của bạn (đảm bảo lưu trữ ở nơi an toàn, không hardcode trong code)
const SECRET_KEY = 'your_secret_key'

// Middleware xác thực token
function verifyToken (token) {
  try {
    // Giải mã token và trả về payload (dữ liệu của token)
    const decoded = jwt.verify(token, SECRET_KEY)
    console.log('Token hợp lệ:', decoded)
    return decoded; // Trả về thông tin người dùng và sản phẩm từ token
  } catch (error) {
    console.error('Token không hợp lệ:', error.message)
    throw new Error('Token không hợp lệ.')
  }
}

module.exports = { verifyToken}
