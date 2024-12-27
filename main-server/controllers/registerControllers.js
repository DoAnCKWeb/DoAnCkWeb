const { checkAccountExists, addUser } = require('../models/connectDatabase')
const bcrypt= require('bcrypt')
const register = async (req, res) => {
    const { username, email, password } = req.body;
    try { 
        const userExists = await checkAccountExists(email);
        if (userExists) {
             res.redirect('/register');
        }

        //hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        await addUser(username,email, hashedPassword);
        res.redirect('/login');
    }
    catch(err) {
        console.log('Lỗi đăng kí ', err);
        
    }
}
module.exports = register;