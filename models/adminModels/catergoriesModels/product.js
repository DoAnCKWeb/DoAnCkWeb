const { db } = require('../../../models/connectDatabase')
const getProduct = async (id) => {
    try {
        const data = await db.any('SELECT * FROM "products" WHERE "category_id" = $1 ORDER BY "product_id" ASC', [id]);
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
const addProduct = async ({ 
    product_name, 
    price, 
    storage_capacity, 
    operating_system, 
    screen_size, 
    weight, 
    release_year, 
    category_id, 
    image 
}) => {
    try {
        // Chèn dữ liệu vào bảng "products"
        await db.none(
            `INSERT INTO "products" 
            ("product_name", "price", "storage_capacity", "operating_system", "screen_size", "weight", "release_year", "category_id", "image") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
            [
                product_name, 
                price, 
                storage_capacity, 
                operating_system, 
                screen_size, 
                weight, 
                release_year, 
                category_id, 
                image
            ]
        );
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        throw new Error('Lỗi khi thêm sản phẩm');
    }
};


// Sửa thông tin sản phẩm
const updateProduct = async ({ 
    product_id, 
    product_name, 
    price, 
    storage_capacity, 
    operating_system, 
    screen_size, 
    weight, 
    release_year, 
    image 
}) => {
    try {
        await db.none(
            `UPDATE "products" 
             SET 
                "product_name" = $2, 
                "price" = $3, 
                "storage_capacity" = $4, 
                "operating_system" = $5, 
                "screen_size" = $6, 
                "weight" = $7, 
                "release_year" = $8, 
                "image" = $9
             WHERE 
                "product_id" = $1`,
            [
                product_id, 
                product_name, 
                price, 
                storage_capacity, 
                operating_system, 
                screen_size, 
                weight, 
                release_year, 
                image
            ]
        );
    } catch (err) {
        console.error('Lỗi khi sửa sản phẩm:', err);
        throw new Error('Lỗi khi sửa sản phẩm');
    }
};


// Xóa sản phẩm
const deleteProduct = async (id) => {
    try {
        await db.none('DELETE FROM "products" WHERE "product_id" = $1', [id]);
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        throw new Error('Lỗi khi xóa sản phẩm');
    }
};
//Upload Image
const updateProductImage = async (product_id, imageUrl) => {
    try {
        await db.none('UPDATE "products" SET "image" = $1 WHERE "product_id" = $2', [imageUrl, product_id]);
    } catch (err) {
        console.error('Lỗi khi cập nhật ảnh sản phẩm:', err);
        throw new Error('Lỗi khi cập nhật ảnh sản phẩm');
    }
};
module.exports = {getProduct, addProduct, updateProduct, deleteProduct,getProductById,updateProductImage };