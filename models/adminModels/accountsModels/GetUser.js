const {db}=require('../../connectDatabase')

async function GetAllUser() {
    try {
        const res = await db.query('SELECT * FROM "users"');
        return res; 
    } catch (error) {
        console.error('Lỗi truy vấn:', error);
        throw error; 
    }
}
module.exports={GetAllUser};