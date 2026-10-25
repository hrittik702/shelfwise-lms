const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');
const { resolve } = require('path');

// View All Books
const { getPage, pageInfo, likeTerm } = require('../utils/paginate');

router.get(
  '/',
  wrapAsync(async (req, res) => {
    const q = String(req.query.q || '')
      .trim()
      .slice(0, 50);
    const catId = Number.parseInt(req.query.category, 10);
    const category = Number.isSafeInteger(catId) && catId > 0 ? catId : '';
    const availability = ['available', 'out'].includes(req.query.availability)
      ? req.query.availability
      : 'all';

    const where = [];
    const params = [];
    if (q) {
      const t = likeTerm(q);
      where.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR c.category_name LIKE ?)');
      params.push(t, t, t, t);
    }
    if (category) {
      where.push('b.category_id = ?');
      params.push(category);
    }
    if (availability === 'available') where.push('b.available_copies > 0');
    if (availability === 'out') where.push('b.available_copies = 0');

    const from = `FROM books b JOIN category c ON c.category_id = b.category_id
                ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${from}`, params);
    const pg = pageInfo(total, getPage(req));

    const [books] = await db.query(
      `SELECT b.book_id, b.isbn, b.title, b.author, b.publisher, b.pub_year,
            b.available_copies, b.total_copies, c.category_name
     ${from} ORDER BY b.title LIMIT ? OFFSET ?`,
      [...params, pg.limit, pg.offset]
    );

    const [categories] = await db.query(
      'SELECT category_id, category_name FROM category ORDER BY category_name'
    );

    res.render('books/books.ejs', { books, categories, q, category, availability, ...pg });
  })
);

// Add new Book
router.get(
  '/new',
  wrapAsync(async (req, res) => {
    const [categories] = await db.query(
      `SELECT category_id, category_name
       FROM category
       ORDER BY category_name`
    );
    res.render('books/new.ejs', { categories });
  })
);

// keep /new above this route
router.get(
  '/:book_id',
  wrapAsync(async (req, res) => {
    const id = Number(req.params.book_id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).send('Invalid book ID');

    const [rows] = await db.query(
      `SELECT b.*, c.category_name FROM books b
     JOIN category c ON c.category_id = b.category_id WHERE b.book_id = ?`,
      [id]
    );
    if (!rows[0]) return res.status(404).send('Book not found');

    const [activeLoans] = await db.query(
      `SELECT i.issue_id, m.member_id, m.name AS member_name, m.member_type,
            i.issue_date, i.due_date, DATEDIFF(CURDATE(), i.due_date) AS days_overdue
     FROM issue i JOIN members m ON m.member_id = i.member_id
     WHERE i.book_id = ? AND i.return_date IS NULL ORDER BY i.due_date`,
      [id]
    );

    const [[{ loanCount }]] = await db.query(
      'SELECT COUNT(*) AS loanCount FROM issue WHERE book_id = ?',
      [id]
    );

    res.render('books/view.ejs', { book: rows[0], activeLoans, loanCount });
  })
);

// Book update.ejs
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
      res.render('books/update.ejs', {
        book,
        categories,
      });
    } catch (err) {
      console.error('Error loading update form:', err);
      res.status(500).send('Unable to load the update form');
    }
  })
);

router.post(
  '/:book_id/delete',
  wrapAsync(async (req, res) => {
    const id = Number(req.params.book_id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).send('Invalid book ID');

    const [[{ loanCount }]] = await db.query(
      'SELECT COUNT(*) AS loanCount FROM issue WHERE book_id = ?',
      [id]
    );
    if (loanCount > 0) {
      req.flash('error', 'This book has loan history and cannot be deleted.');
      return res.redirect(`/books/${id}`);
    }
    await db.query('DELETE FROM books WHERE book_id = ?', [id]);
    req.flash('success', 'Book deleted.');
    res.redirect('/books');
  })
);

// Book Update
router.post(
  '/:book_id/update',
  wrapAsync(async (req, res) => {
    const book_id = req.params.book_id;
    const { isbn, title, author, publisher, pub_year, category_id, total_copies } = req.body;
    const [issuedRows] = await db.query(
      'SELECT count(*) as active FROM issue where book_id = ? AND return_date is null',
      [book_id]
    );
    if (!issuedRows[0]) {
      req.flash('error', 'No Active Loans');
    }
    const activeLoans = issuedRows[0].active;
    const newAvailable = Math.max(0, Number(total_copies) - activeLoans);
    const sql = `UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, pub_year = ?, category_id = ?, total_copies = ?, available_copies = ? where book_id = ?`;
    await db.query(sql, [
      isbn,
      title,
      author,
      publisher,
      pub_year,
      category_id,
      total_copies,
      newAvailable,
      book_id,
    ]);
    req.flash('success', `Book info updated Successfully!`);
    res.redirect(`/books/${book_id}`);
  })
);

// Add new Book
router.post(
  '/',
  wrapAsync(async (req, res) => {
    const { isbn, title, author, publisher, pub_year, total_copies } = req.body;
    let resolvedCategoryId = req.body.category_id;
    console.log(resolvedCategoryId);
    if (resolvedCategoryId === 'other' && req.body.new_category_name) {
      const [categoryResult] = await db.query(`INSERT INTO category (category_name) values (?)`, [
        req.body.new_category_name.trim(),
      ]);
      resolvedCategoryId = categoryResult.insertId;
      console.log(resolvedCategoryId);
    }
    const sql = `insert into books (isbn,title,author,publisher,pub_year,category_id,total_copies,available_copies)  values(?,?,?,?,?,?,?,?)`;
    const insert_book = await db.query(sql, [
      isbn,
      title,
      author,
      publisher,
      pub_year,
      resolvedCategoryId,
      total_copies,
      total_copies,
    ]);
    res.redirect('/books');
  })
);

module.exports = router;
