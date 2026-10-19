const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');

// View Books Route
router.get(
  '/',
  wrapAsync(async (req, res) => {
    const sql = `SELECT * from book_details`;
    const [books] = await db.query(sql);
    // console.log(books);
    res.render('books.ejs', { books });
  })
);

router.get(
  '/new',
  wrapAsync(async (req, res) => {
    const [categories] = await db.query(
      `SELECT category_id, category_name
       FROM category
       ORDER BY category_name`
    );
    res.render('book_new.ejs', { categories });
  })
);

router.get(
  '/:book_id',
  wrapAsync(async (req, res) => {
    const sql = `SELECT * FROM book_details WHERE book_id = ?`;
    const [rows] = await db.query(sql, [req.params.book_id]);
    const book = rows[0];
    if (!book) {
      return res.status(404).send('Book not found');
    }
    res.render('single_book.ejs', { book });
  })
);

router.get(
  '/:book_id/update',
  wrapAsync(async (req, res) => {
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
  })
);

router.get(
  ':book_id/delete',
  wrapAsync(async (req, res) => {
    const book_id = req.params.book_id;
    const sql = `delete from books where book_id = ?`;
    await db.query(sql, [book_id]);
    res.redirect('/books');
  })
);

router.post(
  '/:book_id/update',
  wrapAsync(async (req, res) => {
    const book_id = req.params.book_id;
    const sql = `UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, pub_year = ?, category_id = ?, total_copies = ?, available_copies = ? where book_id = ?`;
    const {
      isbn,
      title,
      author,
      publisher,
      pub_year,
      category_id,
      total_copies,
      available_copies,
    } = req.body;
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
  })
);

router.post(
  '/',
  wrapAsync(async (req, res) => {
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
  })
);

module.exports = router;
