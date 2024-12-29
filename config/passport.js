const passport = require('passport');
const bcrypt = require('bcrypt');
const { getUserByEmail, getUserById, getUserByGoogleId, createGoogleUser } = require('../models/authModels/auth'); // Các hàm lấy người dùng từ DB
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
// === Định nghĩa CustomStrategy ===
class CustomStrategy extends passport.Strategy {
  constructor(options = {}, verify) {
    super();
    this.name = options.name || 'custom';
    this.verify = verify;
  }

  authenticate(req, options) {
    const { role, email, password } = req.body;

    // Kiểm tra đầu vào hợp lệ
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return this.fail({ message: 'Dữ liệu đầu vào không hợp lệ.' });
    }

    this.verify(role, email, password, (err, user, info) => {
      if (err) {
        return this.error(err); // Trả về lỗi hệ thống
      }

      if (!user) {
        return this.fail(info || { message: 'Xác thực thất bại.' }); // Trả về thông báo lỗi người dùng
      }

      return this.success(user); // Đăng nhập thành công
    });
  }
}

// === Hàm xác thực cho CustomStrategy ===
const verify = async (role, email, password, done) => {
  try {
    const user = await getUserByEmail(email); // Lấy người dùng từ DB theo email
    if (!user) {
      return done(null, false, { message: 'Email không tồn tại.' });
    }
    if (role !== user.role) {
      return done(null, false, { message: 'Dữ liệu không hợp lệ.' });
    }

    // Kiểm tra mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false, { message: 'Mật khẩu không đúng.' });
    }

    return done(null, { id: user.id, fullname: user.name, role: user.role });
  } catch (err) {
    return done(err); // Xử lý lỗi hệ thống
  }
};

// Sử dụng CustomStrategy cho Passport
passport.use(new CustomStrategy({}, verify));

// === Thêm chiến lược Google OAuth ===
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
      console.log('Google Profile:', profile); // Log toàn bộ dữ liệu từ Google

      const googleId = profile.id;
      const name = profile.displayName || 'No Name';
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

      if (!email) {
          console.error('Email không tồn tại trong profile.');
          return done(null, false, { message: 'Google profile không chứa email.' });
      }

      console.log('Dữ liệu truyền vào createGoogleUser:', { googleId, name, email });

      // Gọi hàm tạo người dùng
      const user = await createGoogleUser(googleId, name, email);
      console.log('Người dùng được tạo:', user);

      return done(null, user);
  } catch (err) {
      console.error('Error in Google Strategy:', err);
      return done(err, false);
  }
}));



// === Lưu trữ ID người dùng vào session khi đăng nhập ===
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// === Lấy thông tin người dùng từ session ===
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Khởi tạo passport với chiến lược tùy chỉnh
function initializePassport(passportInstance) {
  passportInstance.use(new CustomStrategy({}, verify));
}

module.exports = { initializePassport };
