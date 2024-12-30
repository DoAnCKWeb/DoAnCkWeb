const passport = require('passport');
const { db } = require('../models/connectDatabase');

// Render trang đăng nhập
const renderLogin = async (req, res) => {
    const message = req.query.message;
    res.render('login', { message });
};

// Xử lý đăng nhập
const login = async (req, res, next) => {
    passport.authenticate('custom', async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ message: info ? info.message : 'Xác thực thất bại.' });
        }

        req.logIn(user, async (err) => {
            if (err) return next(err);

            req.session.user_id = user.id;

            // Đồng bộ giỏ hàng tạm thời
            const sessionCart = req.session.cart || [];
            let cart = await db.oneOrNone('SELECT * FROM cart WHERE user_id = $1', [user.id]);
            if (!cart) {
                cart = await db.one(
                    'INSERT INTO cart (user_id, session_id) VALUES ($1, $2) RETURNING id',
                    [user.id, req.sessionID]
                );
            }

            for (const item of sessionCart) {
                const existingItem = await db.oneOrNone(
                    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
                    [cart.id, item.product_id]
                );

                if (existingItem) {
                    await db.none(
                        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
                        [item.quantity, existingItem.id]
                    );
                } else {
                    await db.none(
                        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                        [cart.id, item.product_id, item.quantity, item.price]
                    );
                }
            }

            // Xóa giỏ hàng tạm thời sau khi đồng bộ
            delete req.session.cart;

            res.redirect('/categories');
        });
    })(req, res, next);
};

module.exports = {
    renderLogin,
    login,
};
