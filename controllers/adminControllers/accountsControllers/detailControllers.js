const { detailUserById } = require('../../../models/adminModels/accountsModels/detailUser');

const showDetail = async (req, res) => {
     if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
    const id = req.params.id;
    const detail = await detailUserById(id); 
    //console.log(detail); 
    
    res.render('adminViews/detailUser',{detail})
}
module.exports = {showDetail};