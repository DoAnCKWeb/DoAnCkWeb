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
        await addUser(role, username, email, hashedPassword);
        res.redirect('/login');
    }
    catch (err) {
        console.log('Lỗi đăng kí ', err);
        
    }
};
const check_email = async (req, res) => {
    const { email } = req.body;
    try {
    const user = await await checkAccountExists(email);
    if (user) {
      return res.status(200).json({ exists: true, message: "Email đã tồn tại!" });
    }
    return res.status(200).json({ exists: false, message: "Email hợp lệ." });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ exists: false, message: "Có lỗi xảy ra, vui lòng thử lại." });
  }
 } 

module.exports = { register, check_email };