const passport = require('passport');
const { db } = require('../models/connectDatabase');

// Render trang đăng nhập
const renderLogin = async (req, res) => {
    const message = req.query.message;
    res.render('login', { message });
};
// Xử lý đăng nhập bằng Custom Strategy
const login = async (req, res, next) => {
    passport.authenticate('custom', async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ message: info ? info.message : 'Xác thực thất bại.' });
        }

        req.logIn(user, async (err) => {
            if (err) return next(err);

            req.session.user_id = user.id;
            req.session.name = user.name;
            req.session.role = user.role;

            try {
                console.log('Session ID during login:', req.sessionID);

                // Đồng bộ dữ liệu từ `temporary_cart` vào `cart_items`
                const temporaryCart = await db.any('SELECT * FROM "temporary_cart" WHERE "session_id" = $1', [req.sessionID]);
                console.log('Lấy giỏ hàng tạm thời:', temporaryCart);

                let cart = await db.oneOrNone('SELECT * FROM "cart" WHERE "user_id" = $1', [user.id]);
                if (!cart) {
                    cart = await db.one(
                        'INSERT INTO cart ("user_id", "session_id") VALUES ($1, $2) RETURNING id',
                        [user.id, req.sessionID]
                    );
                }

                for (const item of temporaryCart) {
                    const existingItem = await db.oneOrNone(
                        'SELECT * FROM "cart_items" WHERE "cart_id" = $1 AND "product_id" = $2',
                        [cart.id, item.product_id]
                    );

                    if (existingItem) {
                        await db.none(
                            'UPDATE "cart_items" SET "quantity" = "quantity" + $1 WHERE "id" = $2',
                            [item.quantity, existingItem.id]
                        );
                    } else {
                        await db.none(
                            'INSERT INTO "cart_items" ("cart_id", "product_id", "quantity", "price") VALUES ($1, $2, $3, $4)',
                            [cart.id, item.product_id, item.quantity, item.price]
                        );
                    }
                }

                // Xóa giỏ hàng tạm sau khi đồng bộ
                await db.none('DELETE FROM "temporary_cart" WHERE "session_id" = $1', [req.sessionID]);
                console.log('Đồng bộ giỏ hàng thành công.');
            } catch (error) {
                console.error('Lỗi khi đồng bộ giỏ hàng:', error);
            }

            res.redirect(user.role === 'admin' ? '/admin' : '/user');
        });
    })(req, res, next);
};
// Xử lý đăng nhập bằng Google
const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// Xử lý callback sau khi Google xác thực
const googleCallback = async (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.redirect('/login?message=' + encodeURIComponent(info?.message || 'Đăng nhập bằng Google thất bại.'));
        }

        req.logIn(user, async (err) => {
            if (err) return next(err);

            req.session.user_id = user.id;
            req.session.name = user.name;
            req.session.role = user.role;

            // Chuyển hướng dựa trên role
            if (user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/user');
            }
        });
    })(req, res, next);
};

// Xử lý đăng xuất
const logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session during logout:', err);
                return next(err);
            }
            res.clearCookie('connect.sid'); // Xóa cookie session
            res.redirect('/login?message=' + encodeURIComponent('Bạn đã đăng xuất thành công.'));
        });
    });
};

module.exports = {
    renderLogin,
    login,
    googleAuth,
    googleCallback,
    logout
};
