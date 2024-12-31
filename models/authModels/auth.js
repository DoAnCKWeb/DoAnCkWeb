const { db } = require('../connectDatabase');

// Hàm lấy tất cả dữ liệu từ bảng
const all = async (tbName) => {
    try {
        const data = await db.query(`SELECT * FROM "${tbName}"`)
        return data;
    } catch (e) {
        throw e;
    }
} 

// Kiểm tra xem tài khoản có tồn tại không
const checkAccountExists = async (username) => { 
    try {
        const result = await db.oneOrNone('SELECT * FROM "users" WHERE "email" = $1', [username])
        return result ? true : false;
    } catch (e) {
        throw e;
    }
}

// Lấy người dùng theo email
async function getUserByEmail(Email) {
    const res = await db.query('SELECT * FROM "users" WHERE "email" = $1', [Email]);
    return res[0];
}

// Lấy người dùng theo ID
async function getUserById(id) {
    const res = await db.query('SELECT * FROM "users" WHERE "id" = $1', [id]);
    return res[0];
}

// Thêm người dùng mới
const addUser = async (role, username, email, password) => { 
    try {
        await db.none('INSERT INTO "users" ("role","name", "password","email") VALUES ($1, $2, $3, $4)', [role, username, password, email])
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

// === Bổ Sung Thêm Các Hàm Hỗ Trợ Đăng Nhập Bằng Google ===

// Lấy người dùng theo googleId
const getUserByGoogleId = async (googleId) => { 
    try {
        const res = await db.query('SELECT * FROM "users" WHERE "google_id" = $1', [googleId]);
        return res[0];
    } catch (e) {
        throw e;
    }
}

// Tạo người dùng mới qua Google
const createGoogleUser = async (googleId, name, email, role = 'user') => { 
    try {
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await db.oneOrNone(
            'SELECT * FROM "users" WHERE "email" = $1', 
            [email]
        );

        if (existingUser) {
            console.log('Email đã tồn tại, không cần tạo người dùng mới.');
            return existingUser;
        }

        // Tạo người dùng mới nếu email chưa tồn tại
        console.log('Data being inserted:', { googleId, name, email, role }); // Kiểm tra giá trị được truyền vào
        const result = await db.one(
            'INSERT INTO "users" ("google_id", "name", "email", "role") VALUES ($1, $2, $3, $4) RETURNING *', 
            [googleId, name, email, role]
        );
        console.log('Thêm tài khoản Google thành công!', result);
        return result;
    } catch (e) {
        console.error('Error creating Google user:', e);
        return null;
    }
};

// === End Bổ Sung Thêm Các Hàm Hỗ Trợ Đăng Nhập Bằng Google ===

module.exports = { 
    all, 
    getUserByEmail,
    getUserById,
    checkAccountExists,
    addUser,
    checkLogin,
    getUserByGoogleId,       // Bổ sung hàm lấy người dùng theo googleId
    createGoogleUser        // Bổ sung hàm tạo người dùng mới qua Google
}
