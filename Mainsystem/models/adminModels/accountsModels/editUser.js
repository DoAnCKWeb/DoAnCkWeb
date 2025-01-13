const { db } = require('../../connectDatabase'); 

const updateUserById = async (id, { name, email, password,role }) => {
    await db.query('UPDATE "users" SET "name" = $1, "email" = $2, "password" = $3 , "role"=$4  WHERE "id" = $5', [name, email, password,role, id]);
};

module.exports = { updateUserById };
