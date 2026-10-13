// importing library
const express = require('express');
const app = express();
const port = 4000;
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

// view engine for ejs
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.set('public,', path.join(__dirname, '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.listen(port, '0.0.0.0', () => {
  console.log('Server Active');
});

app.get('/', (req, res) => {
  res.render('./index.ejs');
});
