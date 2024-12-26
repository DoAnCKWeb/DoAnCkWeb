const { all } = require('../models/connectDatabase');

// Hàm lấy tất cả user và render trang home
const renderHome = async (req, res) => {
    try {
        if (req.isAuthenticated()) {
        const users = await all('users'); 
        const message = req.query.message;
        res.render('home', { users,message}); 
        }
        else {
            res.redirect('/login?message=Bạn chưa đăng nhập');
        }
        
    } catch (err) {
        console.error('Lỗi khi lấy danh sách Users:', err);
        res.status(500).send('Lỗi server!');
    }
};

module.exports = {
    renderHome
};
