const initOption = {
    capSQL: true
}
const pgp=require('pg-promise')(initOption)
const dbConfig = {
user: 'postgres',
password: 'Mquan_11a2',
host: 'localhost',
port: '5432',
database: 'postgres',
};


const db = pgp(dbConfig)
db.connect()
    .then(obj => {
       
        console.log('Kết nối thành công!');
        obj.done(); // đóng kết nối
    })
    .catch(error => {
        console.error('Lỗi kết nối:', error);
    });

const all = async (tbName)=>{
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

const addUser = async (username, email, password) => {
    const addUserAndPaymentAccount = async (t) => {
        // Bước 1: Thêm user mới vào bảng users
        const user = await t.one(
            'INSERT INTO "users" ("name", "password", "email") VALUES ($1, $2, $3) RETURNING id',
            [username, password, email]
        );

        // Bước 2: Tạo tài khoản thanh toán liên kết với user vừa được thêm
        await t.none(
            'INSERT INTO "payment_accounts" ("id", "balance") VALUES ($1, $2)',
            [user.id, 10000000] // Số dư ban đầu là 0.0
        );
    };

    try {
        // Sử dụng transaction để đảm bảo cả hai thao tác đều thành công hoặc rollback nếu lỗi
        await db.tx(addUserAndPaymentAccount);
        console.log('Thêm tài khoản và tài khoản thanh toán thành công!');
    } catch (e) {
        console.error('Lỗi khi thêm user và tài khoản thanh toán:', e);
        throw e;
    }
};


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


module.exports = { all, getUserByEmail,getUserById,checkAccountExists,addUser,checkLogin };
