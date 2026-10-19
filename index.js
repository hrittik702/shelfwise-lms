// importing library
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 4000; //fix 1.2.1 & .2
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const db = require('./config/db.js');
const flash = require('connect-flash');
const booksRouter = require('./routes/books.js');
const membersRouter = require('./routes/members.js');
const staffRouter = require('./routes/staff.js');

// view engine for ejs
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.set('public,', path.join(__dirname, '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(flash());

db.getConnection()
  .then((connection) => {
    console.log('Connected to the MySQL database.');
    connection.release(); //release the db connection back to pool
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

// session Management
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, db.pool);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server :: Online || http://localhost:${port}`);
});

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

// flash messages
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  res.locals.currUser = req.user;
  next();
});

// Routers
app.use('/books', booksRouter);
app.use('/members', membersRouter);
app.use('/staff', staffRouter);

app.get('/', (req, res) => {
  res.render('./index.ejs');
});
