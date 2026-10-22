// ---------- imports ----------
require('dotenv').config();
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing in .env');
}
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const flash = require('connect-flash');

const db = require('./config/db.js');
const requireAuth = require('./routes/auth.js');
const booksRouter = require('./routes/books.js');
const membersRouter = require('./routes/members.js');
const staffRouter = require('./routes/staff.js');
const circulationRouter = require('./routes/circulation.js');

const app = express();
const port = process.env.PORT || 4000;

// ---------- view engine and body parsing ----------
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ---------- database check ----------
db.getConnection()
  .then((connection) => {
    console.log('Connected to the MySQL database.');
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

// ---------- sessions (must come before flash) ----------
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, db.pool);

app.use(
  session({
    key: 'lms-cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true only when served over HTTPS
    },
  })
);

// ---------- flash and template locals ----------
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  res.locals.currUser = req.session.staffId
    ? { id: req.session.staffId, name: req.session.staffName }
    : null;
  next();
});

// ---------- public routes ----------
app.use('/staff', staffRouter);

// ---------- everything below requires login ----------
app.use(requireAuth);

app.use('/books', booksRouter);
app.use('/members', membersRouter);
app.use('/circulation', circulationRouter);

app.get('/', (req, res) => {
  res.render('index.ejs');
});

// All page Error Checking
app.all('/{*splat}', (req, res, next) => {
  next(new ExpressError(404, 'Page not found!'));
});

app.use((err, req, res, next) => {
  let { status = 500, message = 'Something went wrong' } = err;
  res.render('error.ejs', { err });
  // res.status(status).send(message);
});

// ---------- error handler (after all routes) ----------
app.use((err, req, res, next) => {
  console.error(`Error on ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).send('Page Not Found');
});

// ---------- start server (last) ----------
app.listen(port, '0.0.0.0', () => {
  console.log(`Server :: Online || http://localhost:${port}`);
});
