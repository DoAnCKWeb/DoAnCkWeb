const { checkAccountExists, addUser } = require('../models/authModels/auth')
const bcrypt= require('bcrypt')
const register = async (req, res) => {
    const { role, username, email, password } = req.body;
    //console.log(role, username, email, password);
    try { 
        const userExists = await checkAccountExists(email);
        if (userExists) {
             res.redirect('/register?message="email đã tồn tại , vui lòng nhập email mới !"');
        }

        //hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        await addUser(role,username,email, hashedPassword);
        res.redirect('/login');
    }
    catch(err) {
        console.log('Lỗi đăng kí ', err);
        
    }
}
module.exports = register;