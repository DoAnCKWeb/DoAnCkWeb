const bcrypt = require('bcrypt');
const { updateUserById } = require('../../../models/adminModels/accountsModels/editUser');
const {getUserById }=require('../../../models/authModels/auth')
const showEdit = async (req, res) => {
    const id = req.params.id;
    const user = await getUserById(id); 
    res.render('adminViews/editUser', { user });
};

const updateUser = async (req, res) => {
    const id = req.params.id;
    const { name, email, password, role } = req.body;
    //console.log(name, email, role,password)

    try {
        let hashedPassword = null;

        // Hash mật khẩu mới nếu người dùng nhập
        if (password && password.trim() !== '') {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        // Cập nhật thông tin người dùng, bao gồm role
        await updateUserById(id, { name, email, password: hashedPassword, role });

        // Chuyển hướng về danh sách tài khoản sau khi cập nhật thành công
        res.redirect('/admin/accounts');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Error updating user');
    }
};

module.exports = { showEdit, updateUser };
