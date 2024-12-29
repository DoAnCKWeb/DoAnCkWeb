const passport = require('passport')

// Render trang đăng nhập
const renderLogin = async (req, res) => {
    // Lấy thông báo từ res.locals
     const message = req.query.message;
    res.render('login', {message });
}

// Xử lý đăng nhập bằng Custom Strategy
const login = async (req, res, next) => {
    passport.authenticate('custom', (err, user, info) => {
        if (err) return next(err); // Xử lý lỗi hệ thống
        if (!user) {
            // Nếu không tìm thấy user, trả về thông báo lỗi
            return res.status(401).json({ message: info ? info.message : 'Xác thực thất bại.' });
        }

        req.logIn(user, (err) => {
            if (err) return next(err); // Lỗi khi lưu thông tin user vào session
            req.session.name = user.name;
            req.session.role = user.role;
            // Kiểm tra loại người dùng và chuyển hướng đến trang thích hợp
            if (user.role === 'admin') {
                return res.redirect('/admin');  // Trang quản trị viên
            } else {
                return res.redirect('/user');  // Trang của người dùng thông thường
            }
        });
    })(req, res, next); // Gọi hàm authenticate đúng cách
}

// Bắt đầu quá trình đăng nhập bằng Google
const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// Xử lý callback sau khi Google xác thực
const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) return next(err); // Xử lý lỗi hệ thống
        if (!user) {
            // Nếu không tìm thấy user, chuyển hướng về trang đăng nhập với thông báo lỗi
            return res.redirect('/login?message=' + encodeURIComponent(info.message || 'Đăng nhập bằng Google thất bại.'));
        }

        req.logIn(user, (err) => {
            if (err) return next(err); // Lỗi khi lưu thông tin user vào session
            req.session.name = user.name;
            req.session.role = user.role;
            // Kiểm tra loại người dùng và chuyển hướng đến trang thích hợp
            if (user.role === 'admin') {
                return res.redirect('/admin');  // Trang quản trị viên
            } else {
                return res.redirect('/user');  // Trang của người dùng thông thường
            }
        });
    })(req, res, next);
}

// Xử lý đăng xuất
const logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session during logout:', err);
                return next(err);
            }
            res.clearCookie('connect.sid'); // Xóa cookie session
            res.redirect('/login?message=' + encodeURIComponent('Bạn đã đăng xuất thành công.'));
        });
    });
}

module.exports = {
    renderLogin,
    login,
    googleAuth,
    googleCallback,
    logout
}
