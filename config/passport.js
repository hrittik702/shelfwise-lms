const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [rows] = await db.query('SELECT * FROM staff WHERE username = ?', [username]);
        const user = rows[0];
        if (!user) {
          return done(null, false, { message: 'Incorrect username or Password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect username or Password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      done(null, rows[0]);
    } catch (err) {
      done(err);
    }
  });
};
