const { deleteUserById } = require('../../../models/adminModels/accountsModels/deleteUser');
const deleteUser = async (req, res) => {
    const  id = req.params.id; // Lấy id từ URL
    try {
        await deleteUserById(id); // Xóa người dùng theo id
        res.redirect('/admin/accounts?successMessage=Xóa tài khoản thành công');
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.redirect('/admin/accounts?errorMessage=Lỗi khi xóa tài khoản');
    }
};

module.exports = {deleteUser};