const { db } = require('../../../models/connectDatabase'); // Kết nối database

// Hàm xử lý thống kê doanh thu
const getStatistics = async (req, res) => {
    try {
        // Query 1: Tỉ lệ doanh thu theo danh mục
        const categoryPercentageQuery = `
            SELECT 
                c.name AS category_name,
                COUNT(DISTINCT o.id) AS total_orders,
                SUM(oi.price) AS total_revenue,
                ROUND((SUM(oi.price) * 100.0 / SUM(SUM(oi.price)) OVER ()), 2) AS percentage_revenue
            FROM 
                order_items oi
            JOIN 
                products p ON oi.product_id = p.product_id
            JOIN 
                categories c ON p.category_id = c.id
            JOIN 
                orders o ON oi.order_id = o.id
            GROUP BY 
                c.name
            ORDER BY 
                percentage_revenue DESC;
        `;
        const categoryPercentages = await db.any(categoryPercentageQuery);

        // Query 2: Top 3 sản phẩm theo doanh thu trong từng danh mục
        const topProductsQuery = `
            WITH category_product_revenue AS (
                SELECT 
                    c.name AS category_name,
                    p.product_name,
                    SUM(oi.price) AS total_revenue
                FROM 
                    order_items oi
                JOIN 
                    products p ON oi.product_id = p.product_id
                JOIN 
                    categories c ON p.category_id = c.id
                GROUP BY 
                    c.name, p.product_name
            ),
            ranked_products AS (
                SELECT 
                    category_name,
                    product_name,
                    total_revenue,
                    RANK() OVER (PARTITION BY category_name ORDER BY total_revenue DESC) AS rank
                FROM 
                    category_product_revenue
            )
            SELECT 
                category_name,
                product_name,
                total_revenue
            FROM 
                ranked_products
            WHERE 
                rank <= 3;
        `;
        const topProducts = await db.any(topProductsQuery);

        // Dữ liệu cho biểu đồ 1: Tỉ lệ doanh thu
        const categories = categoryPercentages.map(row => row.category_name);
        const revenues = categoryPercentages.map(row => row.percentage_revenue);

        // Dữ liệu cho biểu đồ 2: Top sản phẩm theo doanh thu
        const productLabels = topProducts.map(product => `${product.category_name} - ${product.product_name}`);
        const productRevenues = topProducts.map(product => product.total_revenue);

        // Kiểm tra quyền truy cập
        if (!req.isAuthenticated()) {
            return res.redirect('/login'); 
        }

        res.render('adminViews/statistics', {
            categories: JSON.stringify(categories),
            revenues: JSON.stringify(revenues),
            topProducts: JSON.stringify(topProducts), // Truyền topProducts
        });
    } catch (error) {
        console.error('Lỗi khi truy vấn dữ liệu:', error);
        res.status(500).send('Lỗi server!');
    }
};

module.exports = {
    getStatistics
};
