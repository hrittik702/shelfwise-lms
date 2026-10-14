// importing library
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.port | 4000;
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const mysql = require('mysql2');

// view engine for ejs
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.set('public,', path.join(__dirname, '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

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

const db = pool.promise();
db.getConnection()
  .then((connection) => {
    console.log('Connected to the MySQL database.');
    connection.release(); //release the db connection back to pool
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

app.listen(port, '0.0.0.0', () => {
  console.log(` Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.render('./index.ejs');
});
