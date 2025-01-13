const { db } = require('../models/connectDatabase');

const getTotalPrice = async (items) => {
  const itemValues = items.map(item => `(${item.id}, ${item.quantity})`).join(', ');
  const query = `
    SELECT SUM(p.price * i.quantity) AS total
    FROM products p
    JOIN (VALUES ${itemValues}) AS i(id, quantity) ON p.product_id = i.id::INTEGER;
  `;
  
  const res = await db.query(query);
  return res[0].total;
};

module.exports = { getTotalPrice };
