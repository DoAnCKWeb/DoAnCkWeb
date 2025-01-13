const { db } = require('../models/connectDatabase');

async function GetMoney(id) {
  try {
    const result = await db.any(`
      SELECT balance
      FROM payment_accounts
      WHERE id = $1
    `, [id]);
    return result[0]; 
  } catch (error) {
    throw new Error(`Lỗi khi lấy số dư: ${error.message}`);
  }
}

module.exports = { GetMoney };
