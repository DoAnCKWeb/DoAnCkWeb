const {getUsersByName}=require('../../../models/adminModels/accountsModels/searchUser')
const Search = async (req, res) => {
     if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
    const { name } = req.body;
    try {
        const users = await getUsersByName(name);
        res.render('adminViews/accounts', { accounts:users });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi hệ thống');
    }
}
module.exports={Search};