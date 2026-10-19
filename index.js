// importing library
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 4000; //fix 1.2.1 & .2
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
// const salt1 = 's0/\/\P4$$w0rD';

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

// session Management
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, pool);

app.use(
  session({
    key: 'lms-cookie',
    secret: 'WdC2027@fJE-LMS',
    store: sessionStore, // save session data in mysql
    resave: false,
    saveUninitialized: true, //empty anonymous visitors
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false,
    },
  })
);

// middlewares

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

// routes for registering staff
app.get('/signup', (req, res) => {
  res.render('signup.ejs');
});

app.post('/signup', async (req, res) => {
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

// login routes for staff
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', async (req, res) => {
  // const salt = bcrypt.genSaltSync(saltRounds);
  try {
    const { username, password } = req.body;
    const sql = `Select password from staff where username=?`;
    const [[staff]] = await db.query(sql, [username]);
    if (staff == undefined) {
      return res.status(401).send(`No Staff found with username : ${username}`);
    }
    const isMatched = await bcrypt.compare(password, staff.password);
    if (!isMatched) {
      return res.status(401).send('Invalid username or password');
    }
    // Success!
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error Occurred during login');
  }
});

app.get('/books', async (req, res) => {
  const sql = `SELECT * from book_details`;
  const [books] = await db.query(sql);
  // console.log(books);
  res.render('books.ejs', { books });
});

app.get('/books/new', async (req, res) => {
  const [categories] = await db.query(
    `SELECT category_id, category_name
       FROM category
       ORDER BY category_name`
  );
  res.render('book_new.ejs', { categories });
});

app.get('/books/:book_id', async (req, res) => {
  const sql = `SELECT * FROM book_details WHERE book_id = ?`;
  const [rows] = await db.query(sql, [req.params.book_id]);
  const book = rows[0];
  if (!book) {
    return res.status(404).send('Book not found');
  }
  res.render('single_book.ejs', { book });
});

app.get('/books/:book_id/update', async (req, res) => {
  try {
    const bookId = Number(req.params.book_id);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).send('Invalid book ID');
    }

    // 1. Fetch the selected book
    const [bookRows] = await db.query(
      `SELECT *
       FROM books
       WHERE book_id = ?`,
      [bookId]
    );

    if (bookRows.length === 0) {
      return res.status(404).send('Book not found');
    }

    const book = bookRows[0];

    // 2. Fetch all categories from the separate category table
    const [categories] = await db.query(
      `SELECT category_id, category_name
       FROM category
       ORDER BY category_name`
    );

    // 3. Pass both datasets to EJS
    res.render('book_update.ejs', {
      book,
      categories,
    });
  } catch (err) {
    console.error('Error loading update form:', err);
    res.status(500).send('Unable to load the update form');
  }
});

app.get('/books/:book_id/delete', async (req, res) => {
  const book_id = req.params.book_id;
  const sql = `delete from books where book_id = ?`;
  await db.query(sql, [book_id]);
  res.redirect('/books');
});

app.post('/books/:book_id/update', async (req, res) => {
  const book_id = req.params.book_id;
  const sql = `UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, pub_year = ?, category_id = ?, total_copies = ?, available_copies = ? where book_id = ?`;
  const { isbn, title, author, publisher, pub_year, category_id, total_copies, available_copies } =
    req.body;
  await db.query(sql, [
    isbn,
    title,
    author,
    publisher,
    pub_year,
    category_id,
    total_copies,
    available_copies < total_copies ? available_copies : total_copies,
    book_id,
  ]);
  console.log('Book Update');
  res.redirect(`/books/${book_id}`);
});

app.post('/books', async (req, res) => {
  const { isbn, title, author, publisher, pub_year, category_id, total_copies } = req.body;
  const sql = `insert into books (isbn,title,author,publisher,pub_year,category_id,total_copies,available_copies)  values(?,?,?,?,?,?,?,?)`;
  //for new books
  //available copies = total copies
  const insert_book = await db.query(sql, [
    isbn,
    title,
    author,
    publisher,
    pub_year,
    category_id,
    total_copies,
    total_copies,
  ]);
  console.log(insert_book);
  res.redirect('/books');
});

// members routes
app.get('/members/new', (req, res) => {
  res.render('member_new.ejs');
});

app.post('/members', async (req, res) => {
  const { name, email, phone, member_type } = req.body;
  const sql = `INSERT INTO members (name,email,phone,member_type,join_date,status) values (?,?,?,?,CURDATE(),"active")`;
  await db.query(sql, [name, email, phone, member_type]);
  res.redirect('/members');
});

app.get('/members', async (req, res) => {
  const sql = 'SELECT * from members';
  const [members] = await db.query(sql);
  console.log(members);
  res.render('members.ejs', { members });
});

app.get('/members/:member_id', async (req, res) => {
  const member_id = req.params.member_id;
  const sql = `select * from members where member_id = ?`;
  const [rows] = await db.query(sql, [member_id]);
  console.log({ member: rows[0] });
  res.render('member_view.ejs', { member: rows[0] });
});

app.get('/members/:member_id/update', async (req, res) => {
  const member_id = req.params.member_id;
  const sql = `select * from members where member_id = ?`;
  const [rows] = await db.query(sql, [member_id]);
  console.log({ member: rows[0] });
  res.render('member_update.ejs', { member: rows[0] });
});

app.post('/members/:member_id/update', async (req, res) => {
  const member_id = req.params.member_id;
  const sql = `update members set name = ?, email = ?, phone =?, member_type = ?,status = ? WHERE member_id = ?`;
  const { name, email, phone, member_type, status } = req.body;
  const result = await db.query(sql, [name, email, phone, member_type, status, member_id]);
  console.log(result);
  res.redirect(`/members/${member_type}`);
});

app.post('/members/:member_id/delete', async (req, res) => {
  const member_id = req.params.member_id;
  const sql = `delete from members where member_id = ?`;
  await db.query(sql, [member_id]);
  res.redirect('/members');
});

app.get('/', (req, res) => {
  res.render('./index.ejs');
});
