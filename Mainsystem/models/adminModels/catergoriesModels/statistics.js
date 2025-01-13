const db = require('../authModels/connectDatabase');

// Hàm lấy tổng doanh thu
const getTotalRevenue = async () => {
    try {
        const query = 'SELECT SUM(total) AS total_revenue FROM orders';
        const result = await db.oneOrNone(query); // Trả về 1 dòng hoặc null
        return result ? result.total_revenue : 0; // Nếu null, trả về 0
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        throw error;
    }
};

module.exports = {
    getTotalRevenue,
};
