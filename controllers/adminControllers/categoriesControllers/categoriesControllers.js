const { getCategory, addCategory, deleteCategory, } = require('../../../models/adminModels/catergoriesModels/catergories')
const { getProduct, getProductById, addProduct, updateProduct, deleteProduct, updateProductImage,  } = require('../../../models/adminModels/catergoriesModels/product');
const path = require('path');
const {db} = require('../../../models/connectDatabase');
// Hàm render trang chủ với danh sách category và sản phẩm
const renderHome = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    try {
        const categories = await getCategory();
        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            const products = await getProduct(category.id);
            category.products = products;
            return category;
        }));
         const role = req.session.role;
        //console.log(categoriesWithProducts);
        res.render('adminViews/categories', { categories: categoriesWithProducts,role });
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
        res.status(500).send('Lỗi server!');
    }
};

// Hàm render form thêm sản phẩm
const renderAddProduct = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    try {
        const { id } = req.params;
        const availableColors = await db.any('SELECT DISTINCT color_name FROM product_colors');
        const role = req.session.role;
        res.render('adminViews/addProduct', { id, availableColors,role });
    } catch (err) {
        console.error('Lỗi khi render form thêm sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm thêm sản phẩm
const addProductHandler = async (req, res) => {
    const { id } = req.params;
    const { product_name, price, storage_capacity, operating_system, screen_size, weight, release_year, image, colors } = req.body;

    try {
        const colors = req.body.colors.map(color => {
            const colorName = color.custom_name || color.name; // Ưu tiên tên màu tự nhập
            return {
                name: colorName,
                stock: parseInt(color.stock),
                image: color.image
            };
        });

        const newProduct = await addProduct({
            product_name,
            price,
            storage_capacity,
            operating_system,
            screen_size,
            weight: parseFloat(weight),
            release_year: parseInt(release_year),
            category_id: parseInt(id),
            image,
            colors: colors.map(color => ({
                name: color.name,
                stock: parseInt(color.stock),
                image: color.image
            }))
        });

        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};




// Hàm render form chỉnh sửa sản phẩm
const renderEditProduct = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    const { id } = req.params; // Lấy product_id từ params

    try {
        const product = await getProductById(parseInt(id)); // Lấy thông tin sản phẩm

        if (!product) {
            return res.status(404).send('Không tìm thấy sản phẩm!');
        }

        const availableColors = product.colors; // Lấy danh sách màu sắc của sản phẩm
        const role = req.session.role;
        console.log(role);


        res.render('adminViews/editProduct', { product, availableColors,role}); // Truyền dữ liệu vào view
    } catch (err) {
        console.error('Lỗi khi render form chỉnh sửa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm chỉnh sửa sản phẩm
const editProductHandler = async (req, res) => {
    const { id } = req.params; // Lấy product_id từ URL
    const { product_name, price, storage_capacity, operating_system, screen_size, weight, release_year, image, colors } = req.body;

    try {
        // Kiểm tra xem colors có tồn tại không
        console.log(colors); // Kiểm tra dữ liệu màu sắc được gửi từ form

        // Gọi service để cập nhật sản phẩm
        await updateProduct({
            product_id: parseInt(id),
            product_name,
            price: parseFloat(price),
            storage_capacity,
            operating_system,
            screen_size,
            weight: parseFloat(weight),
            release_year: parseInt(release_year),
            image,
            colors: colors.map(color => ({
                name: color.name, // Tên màu
                stock: parseInt(color.stock), // Số lượng màu
            }))
        });

        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Lỗi khi cập nhật sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm xóa sản phẩm
const deleteProductHandler = async (req, res) => {
    try {
        await deleteProduct(parseInt(req.params.id));
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};

// Hàm tải ảnh
const uploadProductImageHandler = async (req, res) => {
    const id = parseInt(req.params.id);
    if (!req.files || !req.files.productImage) {
        return res.status(400).send('Không có tệp ảnh nào được tải lên.');
    }
    const imageFile = req.files.productImage;
    const uploadPath = path.join(__dirname, '../../../uploads', imageFile.name);
    try {
        await imageFile.mv(uploadPath);
        const imageUrl = `/uploads/${imageFile.name}`;
        await updateProductImage(id, imageUrl);
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
        res.status(500).send('Lỗi server!');
    }
};

const showProductDetail = async (req, res) => {
    const { id } = req.params; // Lấy product_id từ URL
    const productId = parseInt(id); // Chuyển product_id thành số nguyên

    if (isNaN(productId)) {
        return res.status(400).send('Product ID không hợp lệ!');
    }

    try {
        // Lấy sản phẩm từ database
        const product = await getProductById(productId);

        if (!product) {
            return res.status(404).send('Không tìm thấy sản phẩm!');
        }
         if (!req.isAuthenticated()) {
             return res.redirect('/login'); 
             
        }
        const role = req.session.role;

        // Render trang chi tiết sản phẩm
        res.render('adminViews/detailProduct', { product,role });
    } catch (err) {
        console.error('Lỗi khi lấy thông tin chi tiết sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};

// Hàm thêm danh mục
const addCategoryHandler = async (req, res) => {
    const { name } = req.body; // Lấy tên danh mục từ form

    if (!name) {
        console.error('Tên danh mục không được để trống!');
        return res.status(400).send('Tên danh mục không được để trống!');
    }

    try {
        // Gọi service để thêm danh mục vào database
        await addCategory(name);

        res.redirect('/admin/categories'); // Quay lại trang danh sách danh mục sau khi thêm
    } catch (err) {
        console.error('Lỗi khi thêm danh mục:', err);
        res.status(500).send('Lỗi server!');
    }
};

// Hàm xóa danh mục
const deleteCategoryHandler = async (req, res) => {
    const id = parseInt(req.params.id); // Lấy category_id từ URL

    if (isNaN(id)) {
        console.error('Category ID không hợp lệ:', id);
        return res.status(400).send('Category ID không hợp lệ!');
    }

    try {
        // Gọi service để xóa danh mục
        await deleteCategory(id);

        res.redirect('/admin/categories'); // Quay lại trang danh sách danh mục sau khi xóa
    } catch (err) {
        console.error('Lỗi khi xóa danh mục:', err);
        res.status(500).send('Lỗi server!');
    }
};


module.exports = {
    renderHome,
    renderAddProduct,
    addProductHandler,
    renderEditProduct,
    editProductHandler,
    deleteProductHandler,
    uploadProductImageHandler,
    showProductDetail,
    addCategoryHandler,
    deleteCategoryHandler,
};
