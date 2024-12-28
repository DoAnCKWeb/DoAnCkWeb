const { getCategory } = require('../../../models/adminModels/catergoriesModels/catergories')
const { getProduct, getProductById, addProduct, updateProduct, deleteProduct, updateProductImage } = require('../../../models/adminModels/catergoriesModels/product');
const path = require('path');
// Hàm render trang chủ với danh sách category và sản phẩm
const renderHome = async (req, res) => {
    try {
        // Lấy tất cả danh mục
        const categories = await getCategory();
        //console.log(categories);

        // Lặp qua tất cả danh mục và lấy sản phẩm tương ứng
        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            // Lấy sản phẩm tương ứng với CatID của mỗi category
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
    const { CatID } = req.params;
    // Lấy CatID từ params
    res.render('addProduct', { CatID });
}

// Hàm thêm sản phẩm
const addProductHandler = async (req, res) => {
    const { CatID } = req.params;
    const catid = parseInt(CatID);

    if (isNaN(catid)) {
        console.error('CatID không hợp lệ:', CatID);
        return res.status(400).send('CatID không hợp lệ!');
    }
    const { name, price, description,fulldes,quantity } = req.body;    
    try {
        await addProduct({ name, price, description , catid,fulldes ,quantity}); // Thêm sản phẩm vào database
        res.redirect('/');  // Quay lại trang chủ sau khi thêm
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm render form chỉnh sửa sản phẩm
const renderEditProduct = async (req, res) => {
    const { ProID } = req.params;  // Lấy ProID từ params
    const id = parseInt(ProID);  // Chuyển ProID thành số nguyên

    try {
        const product = await getProductById(id);  // Lấy thông tin sản phẩm tương ứng với ProID
        res.render('editProduct', { product });
    } catch (err) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm chỉnh sửa sản phẩm
const editProductHandler = async (req, res) => {
    const { ProID } = req.params;  // Lấy ProID từ URL params
    const id = parseInt(ProID);  // Chuyển ProID thành số nguyên
    const { name, price, description, fulldes, quantity } = req.body;  // Lấy dữ liệu từ body

    // Kiểm tra xem ProID có hợp lệ không
    if (isNaN(id)) {
        console.error('ProID không hợp lệ:', ProID);
        return res.status(400).send('ProID không hợp lệ!');
    }

    try {
        await updateProduct(id, name, price, description, fulldes, quantity);  // Cập nhật sản phẩm trong database
        res.redirect('/');  // Quay lại trang chủ sau khi sửa
    } catch (err) {
        console.error('Lỗi khi sửa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};


// Hàm xóa sản phẩm
const deleteProductHandler = async (req, res) => {
    const id = parseInt(req.params.ProID);
    try {
        await deleteProduct(id); // Xóa sản phẩm khỏi database
        res.redirect('/'); // Quay lại trang chủ sau khi xóa
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        res.status(500).send('Lỗi server!');
    }
};
const uploadProductImageHandler = async (req, res) => {
    // Lấy ProID từ URL
    const ProID = parseInt(req.params.ProID);
    if (isNaN(ProID)) {
        return res.status(400).send('ProID không hợp lệ.');
    }

    // Lấy file từ req.files
    if (!req.files || !req.files.productImage) {
        return res.status(400).send('Không có tệp ảnh nào được tải lên.');
    }

    const imageFile = req.files.productImage;
    const uploadPath = path.join(__dirname, '../uploads/', imageFile.name);

    try {
        // Lưu tệp ảnh vào thư mục "uploads"
        await imageFile.mv(uploadPath);

        // Cập nhật đường dẫn ảnh trong cơ sở dữ liệu
        const imageUrl = `/uploads/${imageFile.name}`;
        await updateProductImage(ProID, imageUrl);

        // Chuyển hướng về trang chủ sau khi tải ảnh thành công
        res.redirect('/');
    } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
        res.status(500).send('Lỗi server khi tải ảnh.');
    }
};



module.exports = {
    renderHome,
    renderAddProduct,
    addProductHandler,
    renderEditProduct,
    editProductHandler,
    deleteProductHandler,
    uploadProductImageHandler
};
