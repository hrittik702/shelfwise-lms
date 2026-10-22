const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const wrapAsync = require('../utils/wrapAsync.js');
const requireAuth = require('./auth.js');
const db = require('../config/db.js');

const SALT_ROUNDS = 10;

router.get('/login', (req, res) => {
  if (req.session.staffId) return res.redirect('/');
  res.render('staff/login.ejs');
});

router.post(
  '/login',
  wrapAsync(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash('error', 'Username and password are required.');
      return res.redirect('/staff/login');
    }

    const [rows] = await db.query('SELECT staff_id, name, password FROM staff WHERE username = ?', [
      username,
    ]);
    const staff = rows[0];

    // same message for unknown user and wrong password
    const ok = staff && (await bcrypt.compare(password, staff.password));
    if (!ok) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/staff/login');
    }

    // new session ID after login (prevents session fixation)
    await new Promise((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    );
    req.session.staffId = staff.staff_id;
    req.session.staffName = staff.name;
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    req.flash('success', `Welcome, ${staff.name}.`);
    res.redirect('/');
  })
);

// only a logged-in staff member can create another staff account
router.get('/signup', requireAuth, (req, res) => {
  res.render('staff/signup.ejs');
});

router.post(
  '/signup',
  requireAuth,
  wrapAsync(async (req, res) => {
    const name = (req.body.name || '').trim();
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';

    if (!name || !username || password.length < 8) {
      req.flash('error', 'Name, username and a password of at least 8 characters are required.');
      return res.redirect('/staff/signup');
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    try {
      await db.query('INSERT INTO staff (name, username, password) VALUES (?, ?, ?)', [
        name,
        username,
        hash,
      ]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'That username already exists.');
        return res.redirect('/staff/signup');
      }
      throw err;
    }

    req.flash('success', 'Staff account created.');
    res.redirect('/');
  })
);

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('lms-cookie');
    res.redirect('/staff/login');
  });
});

module.exports = router;
