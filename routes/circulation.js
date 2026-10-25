const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');

router.get(
  '/',
  wrapAsync(async (req, res) => {
    const [issues] = await db.query(`
      SELECT *, DATEDIFF(CURDATE(), due_date) AS days_overdue
      FROM issue_details
      WHERE return_date IS NULL
      ORDER BY due_date ASC`);
    res.render('circulation/view.ejs', { issues });
  })
);

router.get(
  '/issue',
  wrapAsync(async (req, res) => {
    const sql1 = `select * from member_details`;
    const sql2 = `select book_id, title, isbn, available_copies, total_copies from books`;
    const [members] = await db.query(sql1);
    const [books] = await db.query(sql2);
    res.render('circulation/issue.ejs', {
      members,
      books,
      selectedMemberId: req.query.member_id,
      selectedBookId: req.query.book_id,
    });
  })
);

router.post(
  '/issue',
  wrapAsync(async (req, res) => {
    // 1. read inputs
    const memberId = Number(req.body.member_id);
    const bookId = Number(req.body.book_id);
    const staffId = req.session.staffId;

    // 2. validate inputs before touching the database
    if (![memberId, bookId].every((n) => Number.isSafeInteger(n) && n > 0)) {
      req.flash('error', 'Select a member and a book.');
      return res.redirect('/circulation/issue');
    }

    const conn = await db.getConnection();
    let error = null;
    try {
      await conn.beginTransaction();

      // 3. fetch and lock both rows
      const [[member]] = await conn.query(
        'SELECT member_id, name, member_type, status FROM members WHERE member_id = ? FOR UPDATE',
        [memberId]
      );
      const [[book]] = await conn.query(
        'SELECT book_id, title, available_copies FROM books WHERE book_id = ? FOR UPDATE',
        [bookId]
      );

      // 4. check rules in order, stop at the first failure
      if (!member || !book) error = 'Member or book not found.';
      else if (member.status !== 'active') error = `${member.name} is suspended.`;
      else if (book.available_copies <= 0) error = `No copies of "${book.title}" left.`;

      if (!error) {
        const [[{ active }]] = await conn.query(
          'SELECT COUNT(*) AS active FROM issue WHERE member_id = ? AND return_date IS NULL',
          [memberId]
        );
        const max = member.member_type === 'faculty' ? 5 : 3;
        if (active >= max) error = `${member.name} already holds ${active} books (limit ${max}).`;
      }

      if (!error) {
        const [[{ dup }]] = await conn.query(
          'SELECT COUNT(*) AS dup FROM issue WHERE member_id = ? AND book_id = ? AND return_date IS NULL',
          [memberId, bookId]
        );
        if (dup > 0) error = 'This member already has this book.';
      }

      // 5. write, or roll back
      if (error) {
        await conn.rollback();
      } else {
        await conn.query(
          `INSERT INTO issue (book_id, member_id, staff_id, issue_date, due_date)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
          [bookId, memberId, staffId]
        );
        await conn.query(
          'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?',
          [bookId]
        );
        await conn.commit();
      }
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release(); // always give the connection back
    }

    // 6. respond after the transaction is finished
    if (error) {
      req.flash('error', error);
      return res.redirect('/circulation/issue');
    }
    req.flash('success', 'Book issued. Due in 14 days.');
    res.redirect('/circulation/issue');
  })
);

module.exports = router;
