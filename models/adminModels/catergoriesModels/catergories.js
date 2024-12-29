const { db } = require('../../../models/connectDatabase')

const getCategory = async () => {
    try {
        const data = await db.any('SELECT * FROM "categories"');
        return data;
    } catch (e) {
        console.error('Lỗi khi lấy danh sách danh mục:', e);
        throw e;
    }
};

const addCategory = async (name) => {
    try {
        await db.none(
            `INSERT INTO "categories" ("name") VALUES ($1)`, [name]);
    } catch (e) {
        console.error('Lỗi khi thêm danh mục:', e);
        throw e;
    }
};


module.exports = { getCategory, addCategory };