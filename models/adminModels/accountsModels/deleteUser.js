const { db } = require('../../connectDatabase'); // Kết nối CSDL

// Hàm xóa người dùng theo id
async function deleteUserById(id) {
    try {
        return await db.query(`DELETE FROM "users" WHERE "id" = $1`, [id]);
    } catch (error) {
        console.error('Lỗi truy vấn:', error);
        throw error;
    }
}
module.exports = { deleteUserById };
