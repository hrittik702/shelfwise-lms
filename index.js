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

// password hashing
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt1 = 's0/\/\P4$$w0rD';

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

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  // const salt = bcrypt.genSaltSync(saltRounds);
  // console.log(bcrypt.hashSync(req.body.password, salt));
  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(req.body.password, salt, function (err, hash) {
      const sql = `INSERT INTO staff(name,username,password) values (?,?,?)`;
      const result = db.query(sql, [req.body.name, req.body.username, hash], (err, res) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Error Saving staff');
        }
      });
      console.log('Query OK, Insert ID : ', result.insertId);
      res.status(200).send('Staff added successfully');
    });
  });
});

app.get('/users', async (req, res) => {
  try {
    // Run your SQL query using await
    const [rows] = await db.query('SELECT * FROM users');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/', (req, res) => {
  res.render('./index.ejs');
});
