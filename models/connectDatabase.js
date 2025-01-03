const initOption = {
    capSQL: true
}
const pgp=require('pg-promise')(initOption)
const dbConfig = {
user: 'postgres',
password: '123456',
host: 'localhost',
port: '5432',
database: 'webofffical',
};

const db = pgp(dbConfig)
db.connect()
    .then(obj => {
       
        console.log('Kết nối thành công!');
        obj.done(); // đóng kết nối
    })
    .catch(error => {
        console.error('Lỗi kết nối:', error);
    });

module.exports = {db};
