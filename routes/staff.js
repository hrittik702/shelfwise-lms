const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/login', (req, res) => {
  res.render('staff/login.ejs');
});

router.post(
  '/login',
  wrapAsync(async (req, res) => {
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
  })
);

router.get('/signup', (req, res) => {
  res.render('staff/signup.ejs');
});

router.post(
  '/signup',
  wrapAsync(async (req, res) => {
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
  })
);

module.exports = router;
