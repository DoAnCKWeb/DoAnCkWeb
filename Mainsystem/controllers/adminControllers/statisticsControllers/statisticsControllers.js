const { db } = require('../../../models/connectDatabase'); // Kết nối database

// Hàm xử lý thống kê doanh thu
const getStatistics = async (req, res) => {
    try {
        // Nhận tham số ngày từ query string
        const { startDate, endDate } = req.query;

        // Xác định điều kiện ngày dựa trên bảng `orders.created_at`
        const dateCondition = startDate && endDate
            ? `WHERE o.created_at BETWEEN '${startDate}' AND '${endDate}'`
            : '';

        // Tổng doanh thu
        const totalRevenueQuery = `SELECT SUM(o.total) AS total_revenue FROM orders o ${dateCondition}`;
        const totalRevenueResult = await db.oneOrNone(totalRevenueQuery);
        const totalRevenue = totalRevenueResult ? totalRevenueResult.total_revenue : 0;

        // Tổng sản phẩm bán ra
        const totalProductsSoldQuery = `
            SELECT SUM(oi.quantity) AS total_products_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            ${dateCondition}`;
        const totalProductsSoldResult = await db.oneOrNone(totalProductsSoldQuery);
        const totalProductsSold = totalProductsSoldResult ? totalProductsSoldResult.total_products_sold : 0;

        // Tổng lượng khách hàng
        const totalCustomersQuery = `
            SELECT COUNT(DISTINCT o.user_id) AS total_customers
            FROM orders o
            ${dateCondition}`;
        const totalCustomersResult = await db.oneOrNone(totalCustomersQuery);
        const totalCustomers = totalCustomersResult ? totalCustomersResult.total_customers : 0;

        // Tổng số đơn hàng
        const totalOrdersQuery = `
            SELECT COUNT(DISTINCT o.id) AS total_orders
            FROM orders o
            ${dateCondition}`;
        const totalOrdersResult = await db.oneOrNone(totalOrdersQuery);
        const totalOrders = totalOrdersResult ? totalOrdersResult.total_orders : 0;

        // Tỉ lệ doanh thu theo danh mục
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
            ${dateCondition}
            GROUP BY 
                c.id, c.name
            ORDER BY 
                c.id;
        `;
        const categoryPercentages = await db.any(categoryPercentageQuery);

        // Top 3 sản phẩm theo doanh thu trong từng danh mục
        const topProductsQuery = `
            WITH category_product_revenue AS (
                SELECT 
                    c.id AS category_id,
                    c.name AS category_name,
                    p.product_name,
                    SUM(oi.price) AS total_revenue
                FROM 
                    order_items oi
                JOIN 
                    products p ON oi.product_id = p.product_id
                JOIN 
                    categories c ON p.category_id = c.id
                JOIN 
                    orders o ON oi.order_id = o.id
                ${dateCondition}
                GROUP BY 
                    c.id, c.name, p.product_name
            ),
            ranked_products AS (
                SELECT 
                    category_id,
                    category_name,
                    product_name,
                    total_revenue,
                    RANK() OVER (PARTITION BY category_id ORDER BY total_revenue DESC) AS rank
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
                rank <= 3
            ORDER BY 
                category_id, rank;
        `;
        const topProducts = await db.any(topProductsQuery);

        // Dữ liệu cho biểu đồ 1: Tỉ lệ doanh thu
        const categories = categoryPercentages.map(row => row.category_name);
        const revenues = categoryPercentages.map(row => row.percentage_revenue);

        // Kiểm tra quyền truy cập
        if (!req.isAuthenticated()) {
            return res.redirect('/login'); 
        }
        const role = req.session.role;

        // Render dữ liệu ra view
        res.render('adminViews/statistics', {
            totalRevenue, // Tổng doanh thu
            totalProductsSold, // Tổng sản phẩm bán ra
            totalCustomers, // Tổng lượng khách hàng
            totalOrders, // Tổng số đơn hàng
            categories: JSON.stringify(categories),
            revenues: JSON.stringify(revenues),
            topProducts: JSON.stringify(topProducts), // Truyền topProducts
            role
        });
    } catch (error) {
        console.error('Lỗi khi truy vấn dữ liệu:', error);
        res.status(500).send('Lỗi server!');
    }
};

module.exports = {
    getStatistics
};
