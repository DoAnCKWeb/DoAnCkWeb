const {showOrders}=require('../models/GetAllOrder')
const showPaymentViews = async (req, res) => {
    const orders = await showOrders();
    res.render('layouts/main', { orders })
}
module.exports = { showPaymentViews };