const { db } = require('../../../models/connectDatabase')
const getProduct = async (id) => {
    try {
        const data = await db.any('SELECT * FROM "products" WHERE "category_id" = $1', [id]);
        return data;
    } catch (e) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', e);
        throw e;
    }
}
const getProductById = async (id) => {
    try {
        const data = await db.any('SELECT * FROM "products" WHERE "product_id" = $1', [id]);
        return data[0];
    } catch (e) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', e);
        throw e;
    }
}
// Thêm sản phẩm mới
const addProduct = async ({ name, price, description, catid,fulldes ,quantity}) => {
    try {
        await db.none('INSERT INTO "Products" ("ProName", "Price", "TinyDes","CatID","FullDes","Quantity") VALUES ($1, $2, $3, $4,$5,$6)', 
            [name, price, description, catid,fulldes,quantity]);
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        throw new Error('Lỗi khi thêm sản phẩm');
    }
};

// Sửa thông tin sản phẩm
const updateProduct = async ({ id, name, price, description, fulldes, quantity}) => {
    try {
        await db.none('UPDATE "Products" SET "ProName" = $2, "Price" = $3, "Quantity" = $6, "TinyDes" = $4, "FullDes" = $5 WHERE "ProID" = $1', 
            [id, name, price, description, fulldes, quantity]);
    } catch (err) {
        console.error('Lỗi khi sửa sản phẩm:', err);
        throw new Error('Lỗi khi sửa sản phẩm');
    }
};

// Xóa sản phẩm
const deleteProduct = async (id) => {
    try {
        await db.none('DELETE FROM "Products" WHERE "ProID" = $1', [id]);
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        throw new Error('Lỗi khi xóa sản phẩm');
    }
};
//Upload Image
const updateProductImage = async (ProID, imageUrl) => {
    try {
        await db.none('UPDATE "Products" SET "Image" = $1 WHERE "ProID" = $2', [imageUrl, ProID]);
    } catch (err) {
        console.error('Lỗi khi cập nhật ảnh sản phẩm:', err);
        throw new Error('Lỗi khi cập nhật ảnh sản phẩm');
    }
};
module.exports = {getProduct, addProduct, updateProduct, deleteProduct,getProductById,updateProductImage };