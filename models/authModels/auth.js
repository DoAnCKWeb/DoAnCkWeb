const {db}=require('../connectDatabase')
const all = async (tbName) => {
    try {
        const data = await db.query(`SELECT * FROM "${tbName}"`)
        return data;
    } catch (e) {
        throw e;
    }
} 
const checkAccountExists = async (username) => { 
    try {
        const result = await db.oneOrNone('SELECT * FROM "users" WHERE "email" = $1', [username])
        return result? true : false;
    } catch (e) {
        throw e;
    }
}
async function getUserByEmail(Email) {
    const res = await db.query('SELECT * FROM "users" WHERE "email" = $1', [Email]);
    return res[0];
}

async function getUserById(id) {
    const res = await db.query('SELECT * FROM "users" WHERE "id" = $1', [id]);
    return res[0];
}
const addUser = async (role,username,email, password) => { 
    try {
        await db.none('INSERT INTO "users" ("role","name", "password","email") VALUES ($1, $2,$3,$4)', [role,username, password,email])
        console.log('Thêm tài khoản thành công!');
    } catch (e) {
        throw e;
    }

}
// Kiểm tra tài khoản và mật khẩu
const checkLogin = async (email, password) => {
    // Kiểm tra xem email và password có giá trị không
    if (!email || !password) {
        throw new Error("Email or password is missing");
    }
    try {
        const user = await db.oneOrNone(
            `SELECT * FROM "users" WHERE "email" = $1 AND "password" = $2`, [email, password]
        );
        return user; // Nếu có, trả về thông tin user, nếu không trả về null
    } catch (e) {
        console.error('Lỗi khi kiểm tra đăng nhập:', e);
        throw e;
    }
};
module.exports = {all, getUserByEmail,getUserById,checkAccountExists,addUser,checkLogin }