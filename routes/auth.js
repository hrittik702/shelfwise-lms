module.exports = (req, res, next) => {
  if (req.session && req.session.staffId) return next();
  req.flash('error', 'Please log in first.');
  res.redirect('/staff/login');
};
