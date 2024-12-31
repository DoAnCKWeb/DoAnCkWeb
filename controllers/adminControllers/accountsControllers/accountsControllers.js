const { GetAllUser } = require('../../../models/adminModels/accountsModels/GetUser');

const showAccounts = async (req, res) => {
     if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
    try {
        const accounts = await GetAllUser(); 
        const role = req.session.role;
        res.render('adminViews/accounts', {
            accounts,
            successMessage: req.query.successMessage || '',
            errorMessage: req.query.errorMessage || '',
            role
         });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu người dùng:', error);
        res.status(500).send('Lỗi máy chủ nội bộ');
    }
};

module.exports = { showAccounts };
