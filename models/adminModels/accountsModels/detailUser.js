const { db } = require('../../connectDatabase'); // Kết nối CSDL

// Hàm xóa người dùng theo id
async function detailUserById(id) {
    try {
        const res = await db.query(`SELECT * FROM "users" WHERE "id" = $1`, [id]);
        return res[0];
    } catch (error) {
        console.error('Lỗi truy vấn:', error);
        throw error;
    }
}
module.exports = { detailUserById };
