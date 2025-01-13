const bcrypt = require('bcrypt');
const { checkAccountExists } = require('../../../models/authModels/auth');
const { addUser } = require('../../../models/authModels/auth');

const addUserController = async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const userExists = await checkAccountExists(email);
        if (userExists) {
            // Sử dụng query string để truyền thông báo lỗi
            return res.redirect('/admin/accounts?errorMessage=Email đã tồn tại, vui lòng chọn email khác!');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await addUser(role, name, email, hashedPassword);

        // Sử dụng query string để truyền thông báo thành công
        return res.redirect('/admin/accounts?successMessage=Thêm tài khoản thành công!');
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
}

module.exports = { addUserController };
