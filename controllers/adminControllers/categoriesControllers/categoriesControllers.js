const { getCategory, addCategory, deleteCategory, } = require('../../../models/adminModels/catergoriesModels/catergories')
const { getProduct, getProductById, addProduct, updateProduct, deleteProduct, updateProductImage,  } = require('../../../models/adminModels/catergoriesModels/product');
const path = require('path');
// Hàm render trang chủ với danh sách category và sản phẩm
const renderHome = async (req, res) => {
     if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
    try {
        // Lấy tất cả danh mục
        const categories = await getCategory();
        //console.log(categories);

        // Lặp qua tất cả danh mục và lấy sản phẩm tương ứng
        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            const products = await getProduct(category.id);
            //console.log(products);
            category.products = products; 
            //console.log(category);
            return category;
        }));
        //console.log(categoriesWithProducts);
        res.render('adminViews/categories', { categories: categoriesWithProducts });
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
    const { id } = req.params;
    // Lấy CatID từ params
    res.render('adminViews/addProduct', { id });
}

// Hàm thêm sản phẩm
const addProductHandler = async (req, res) => {
    const { id } = req.params; // Lấy category_id từ URL
    const catid = parseInt(id); // Chuyển đổi sang số nguyên

    if (isNaN(catid)) {
        console.error('CatID không hợp lệ:', id);
        return res.status(400).send('CatID không hợp lệ!');
    }

    // Lấy dữ liệu từ form
    const { 
        product_name, 
        price, 
        storage_capacity, 
        operating_system, 
        screen_size, 
        weight, 
        release_year, 
        image 
    } = req.body;

    try {
        // Gọi service để thêm sản phẩm vào database
        await addProduct({ 
            product_name, 
            price, 
            storage_capacity, 
            operating_system, 
            screen_size, 
            weight: parseFloat(weight), // Chuyển trọng lượng sang kiểu số thực
            release_year: parseInt(release_year), // Chuyển năm phát hành sang kiểu số nguyên
            category_id: catid, 
            image 
        });

        res.redirect('/admin/categories'); // Quay lại trang danh sách danh mục sau khi xóa
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};



// Hàm render form chỉnh sửa sản phẩm
const renderEditProduct = async (req, res) => {
    const { id } = req.params;  // Lấy product_id từ params
    const productId = parseInt(id);  // Chuyển product_id thành số nguyên

    if (isNaN(productId)) {
        return res.status(400).send('ID sản phẩm không hợp lệ!');
    }

    try {
        // Lấy thông tin sản phẩm từ database
        const product = await getProductById(productId);

        if (!product) {
            return res.status(404).send('Không tìm thấy sản phẩm!');
        }
         if (!req.isAuthenticated()) {
           return res.redirect('/login'); 
        }
        // Render view với dữ liệu sản phẩm
        res.render('adminViews/editProduct', { product });
    } catch (err) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};

// Hàm chỉnh sửa sản phẩm
const editProductHandler = async (req, res) => {
    const { id } = req.params;  // Lấy product_id từ URL
    const productId = parseInt(id);  // Chuyển product_id thành số nguyên

    // Lấy dữ liệu từ form
    const {
        product_name,
        price,
        storage_capacity,
        operating_system,
        screen_size,
        weight,
        release_year,
        image
    } = req.body;

    if (isNaN(productId)) {
        console.error('Product ID không hợp lệ:', id);
        return res.status(400).send('Product ID không hợp lệ!');
    }

    try {
        // Gọi service để cập nhật sản phẩm
        await updateProduct({
            product_id: productId,
            product_name,
            price: parseFloat(price),
            storage_capacity,
            operating_system,
            screen_size,
            weight: parseFloat(weight),
            release_year: parseInt(release_year),
            image
        });

        res.redirect('/admin/categories');

    } catch (err) {
        console.error('Lỗi khi sửa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm xóa sản phẩm
const deleteProductHandler = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteProduct(id); // Xóa sản phẩm khỏi database
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};

const uploadProductImageHandler = async (req, res) => {
    // Lấy ProID từ URL
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).send('ProID không hợp lệ.');
    }

    // Lấy file từ req.files
    if (!req.files || !req.files.productImage) {
        return res.status(400).send('Không có tệp ảnh nào được tải lên.');
    }

    const imageFile = req.files.productImage;
    const uploadPath = path.join(__dirname, '../../../uploads', imageFile.name);

    try {
        // Lưu tệp ảnh vào thư mục "uploads"
        await imageFile.mv(uploadPath);

        // Cập nhật đường dẫn ảnh trong cơ sở dữ liệu
        const imageUrl = `/uploads/${imageFile.name}`;
        await updateProductImage(id, imageUrl);

        // Chuyển hướng về trang chủ sau khi tải ảnh thành công
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
        res.status(500).send('Lỗi server khi tải ảnh.');
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
        // Render trang chi tiết sản phẩm
        res.render('adminViews/detailProduct', { product });
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
