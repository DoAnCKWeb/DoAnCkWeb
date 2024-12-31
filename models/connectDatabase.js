const pgp = require('pg-promise')({
    capSQL: true, // Optional: Để hỗ trợ SQL không phân biệt chữ hoa/thường
});

const dbConfig = {
    user: 'postgres',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'web',
};


const db = pgp(dbConfig);

console.log('Kết nối thành công!');

// Hàm truy vấn tất cả bản ghi trong bảng
const all = async (tbName) => {
    try {
        const data = await db.any(`SELECT * FROM ${tbName}`);
        return data;
    } catch (e) {
        throw e;
    }
};

// Kiểm tra tài khoản tồn tại
const checkAccountExists = async (username) => {
    try {
        const result = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [username]);
        return result ? true : false;
    } catch (e) {
        throw e;
    }
};

// Truy vấn user theo email
async function getUserByEmail(Email) {
    try {
        const res = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [Email]);
        return res;
    } catch (e) {
        throw e;
    }
}

// Truy vấn user theo ID
async function getUserById(id) {
    try {
        const res = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
        return res;
    } catch (e) {
        throw e;
    }
}

// Thêm user mới
const addUser = async (role, username, email, password) => {
    try {
        await db.none(
            'INSERT INTO users (role, name, password, email) VALUES ($1, $2, $3, $4)',
            [role, username, password, email]
        );
        console.log('Thêm tài khoản thành công!');
    } catch (e) {
        throw e;
    }
};

// Kiểm tra đăng nhập
const checkLogin = async (email, password) => {
    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        return user; // Trả về user hoặc null nếu không tồn tại
    } catch (e) {
        console.error('Lỗi khi kiểm tra đăng nhập:', e);
        throw e;
    }
};

module.exports = { db, all, getUserByEmail, getUserById, checkAccountExists, addUser, checkLogin };

