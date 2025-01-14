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
};
async function Tru(id, money) {
  try {
    const result = await db.any(`
      UPDATE payment_accounts
      SET balance = balance - $2
      WHERE id = $1
      RETURNING *
    `, [id, money]);

    return result[0];
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật số dư: ${error.message}`);
  }
};
async function Cong(id, money) {
  try {
    const result = await db.any(`
      UPDATE payment_accounts
      SET balance = balance + $2
      WHERE id = $1
      RETURNING *
    `, [id, money]);

    return result[0];
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật số dư: ${error.message}`);
  }
};


module.exports = { GetMoney,Tru,Cong };
