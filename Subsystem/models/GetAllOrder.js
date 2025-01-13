const { db } = require('../models/connectDatabase')
async function showOrders() {
  const result = await db.any(`
    SELECT orders.*, users.name
    FROM orders
    JOIN users ON orders.user_id = users.id
  `);
  //console.log(result);
  return result;
}

module.exports={showOrders}