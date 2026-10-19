// require('dotenv').config();
const mysql = require('mysql2');

//connecting to mysql
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // Will resolve to 4001
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
