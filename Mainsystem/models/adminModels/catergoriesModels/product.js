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
        const product = await db.one('SELECT * FROM "products" WHERE "product_id" = $1', [id]);

        // Lấy danh sách màu sắc của sản phẩm
        const colors = await db.any('SELECT * FROM "product_colors" WHERE "product_id" = $1', [id]);

        return { ...product, colors };
    } catch (e) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', e);
        throw e;
    }
};


// Thêm sản phẩm mới
const addProduct = async ({ product_name, price, storage_capacity, operating_system, screen_size, weight, release_year, category_id, colors }) => {
    try {
        const newProduct = await db.one(
            `INSERT INTO "products" 
            ("product_name", "price", "storage_capacity", "operating_system", "screen_size", "weight", "release_year", "category_id") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "product_id"`,
            [product_name, price, storage_capacity, operating_system, screen_size, weight, release_year, category_id]
        );

        console.log('New Product ID:', newProduct.product_id);

        if (colors && colors.length > 0) {
            for (const color of colors) {
                await db.none(
                    `INSERT INTO "product_colors" 
                    ("product_id", "color_name", "stock") 
                    VALUES ($1, $2, $3)`,
                    [newProduct.product_id, color.name, color.stock]
                );
            }
        }

        return newProduct;
    } catch (err) {
        console.error('Error adding product and colors:', err);
        throw err;
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
    image, 
    colors // Danh sách các màu sắc
}) => {
    try {
        // Cập nhật sản phẩm
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

        // Xóa các màu sắc cũ
        await db.none('DELETE FROM "product_colors" WHERE "product_id" = $1', [product_id]);

        // Thêm lại các màu sắc mới
        for (const color of colors) {
            await db.none(
                `INSERT INTO "product_colors" ("product_id", "color_name", "stock") 
                VALUES ($1, $2, $3)`,
                [product_id, color.name, color.stock]
            );
        }
    } catch (err) {
        console.error('Lỗi khi cập nhật sản phẩm:', err);
        throw new Error('Lỗi khi cập nhật sản phẩm');
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