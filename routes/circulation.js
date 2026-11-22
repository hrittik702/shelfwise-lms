const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/expressError.js');
const db = require('../config/db.js');

router.get(
  '/',
  wrapAsync(async (req, res) => {
    const tab = (req.query.tab || 'active').toLowerCase();

    // 1. Fetch counts for all tabs
    const [[counts]] = await db.query(`
      SELECT 
        COUNT(CASE WHEN return_date IS NULL THEN 1 END) AS active_count,
        COUNT(CASE WHEN return_date IS NULL AND due_date < CURDATE() THEN 1 END) AS overdue_count,
        COUNT(CASE WHEN return_date IS NULL AND due_date = CURDATE() THEN 1 END) AS due_today_count,
        COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) AS returned_count,
        COUNT(*) AS all_count
      FROM issue
    `);

    // 2. Select filter condition based on tab
    let whereClause = 'WHERE i.return_date IS NULL';
    if (tab === 'overdue') {
      whereClause = 'WHERE i.return_date IS NULL AND i.due_date < CURDATE()';
    } else if (tab === 'returned') {
      whereClause = 'WHERE i.return_date IS NOT NULL';
    } else if (tab === 'all') {
      whereClause = '';
    }

    // 3. Fetch transactions with books, members, staff, and fine status
    const [issues] = await db.query(`
      SELECT 
        i.issue_id,
        i.book_id,
        i.member_id,
        i.staff_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        DATEDIFF(COALESCE(i.return_date, CURDATE()), i.due_date) AS days_overdue,
        b.title AS book_title,
        b.isbn,
        m.name AS member_name,
        m.member_type,
        s.name AS staff_name,
        f.fine_id,
        f.amount AS fine_amount,
        f.paid_status AS fine_paid_status,
        f.paid_date AS fine_paid_date
      FROM issue i
      JOIN books b ON b.book_id = i.book_id
      JOIN members m ON m.member_id = i.member_id
      JOIN staff s ON s.staff_id = i.staff_id
      LEFT JOIN fine f ON f.issue_id = i.issue_id
      ${whereClause}
      ORDER BY 
        CASE WHEN i.return_date IS NULL THEN 0 ELSE 1 END,
        i.due_date ASC,
        i.issue_id DESC
    `);

    res.render('circulation/view.ejs', {
      issues,
      currentTab: tab,
      activeCount: Number(counts.active_count) || 0,
      overdueCount: Number(counts.overdue_count) || 0,
      dueTodayCount: Number(counts.due_today_count) || 0,
      returnedCount: Number(counts.returned_count) || 0,
      allCount: Number(counts.all_count) || 0,
    });
  }),
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
  }),
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
        [memberId],
      );
      const [[book]] = await conn.query(
        'SELECT book_id, title, available_copies FROM books WHERE book_id = ? FOR UPDATE',
        [bookId],
      );

      // 4. check rules in order, stop at the first failure
      if (!member || !book) error = 'Member or book not found.';
      else if (member.status !== 'active')
        error = `${member.name} is suspended.`;
      else if (book.available_copies <= 0)
        error = `No copies of "${book.title}" left.`;

      if (!error) {
        const [[{ active }]] = await conn.query(
          'SELECT COUNT(*) AS active FROM issue WHERE member_id = ? AND return_date IS NULL',
          [memberId],
        );
        const max = member.member_type === 'faculty' ? 5 : 3;
        if (active >= max)
          error = `${member.name} already holds ${active} books (limit ${max}).`;
      }

      if (!error) {
        const [[{ dup }]] = await conn.query(
          'SELECT COUNT(*) AS dup FROM issue WHERE member_id = ? AND book_id = ? AND return_date IS NULL',
          [memberId, bookId],
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
          [bookId, memberId, staffId],
        );
        await conn.query(
          'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?',
          [bookId],
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
  }),
);

// Return Book Review Page
router.get(
  '/:issue_id/return',
  wrapAsync(async (req, res, next) => {
    const issueId = Number(req.params.issue_id);
    if (!Number.isSafeInteger(issueId) || issueId <= 0) {
      return next(new ExpressError(404, 'Invalid issue ID.'));
    }

    const issueSql = `
      SELECT
        i.issue_id,
        i.book_id,
        i.member_id,
        i.staff_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
        b.isbn,
        b.title AS book_title,
        b.author,
        b.publisher,
        b.pub_year,
        c.category_name,
        m.name AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        m.member_type,
        m.join_date AS member_join_date,
        m.status AS member_status,
        s.name AS staff_name
      FROM issue i
      JOIN books b ON b.book_id = i.book_id
      LEFT JOIN category c ON c.category_id = b.category_id
      JOIN members m ON m.member_id = i.member_id
      JOIN staff s ON s.staff_id = i.staff_id
      WHERE i.issue_id = ?
    `;
    const [issueRows] = await db.query(issueSql, [issueId]);
    const issue = issueRows[0];

    if (!issue) {
      return next(new ExpressError(404, 'Issue record not found.'));
    }

    if (issue.return_date) {
      req.flash(
        'error',
        `Book "${issue.book_title}" has already been returned.`,
      );
      return res.redirect('/circulation');
    }

    // Check if an existing fine record exists for this issue
    const [fineRows] = await db.query('SELECT * FROM fine WHERE issue_id = ?', [
      issueId,
    ]);
    const existingFine = fineRows[0] || null;

    // Fetch other currently active loans by the same member
    const otherSql = `
      SELECT
        i.issue_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
        b.title AS book_title,
        b.author,
        b.isbn
      FROM issue i
      JOIN books b ON b.book_id = i.book_id
      WHERE i.member_id = ?
        AND i.issue_id != ?
        AND i.return_date IS NULL
      ORDER BY i.due_date ASC
    `;
    const [otherIssues] = await db.query(otherSql, [issue.member_id, issueId]);

    res.render('circulation/return.ejs', {
      issue,
      otherIssues,
      existingFine,
      activePath: '/circulation',
    });
  }),
);

// Execute Return Transaction
router.post(
  '/:issue_id/return',
  wrapAsync(async (req, res) => {
    const issueId = Number(req.params.issue_id);
    if (!Number.isSafeInteger(issueId) || issueId <= 0) {
      req.flash('error', 'Invalid issue ID.');
      return res.redirect('/circulation');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Fetch and lock issue record
      const [[issue]] = await conn.query(
        `SELECT i.issue_id, i.book_id, i.member_id, i.due_date, i.return_date,
                DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
                b.title AS book_title,
                m.name AS member_name
         FROM issue i
         JOIN books b ON b.book_id = i.book_id
         JOIN members m ON m.member_id = i.member_id
         WHERE i.issue_id = ? FOR UPDATE`,
        [issueId],
      );

      if (!issue) {
        await conn.rollback();
        req.flash('error', 'Issue record not found.');
        return res.redirect('/circulation');
      }

      if (issue.return_date) {
        await conn.rollback();
        req.flash(
          'error',
          `Book "${issue.book_title}" has already been returned.`,
        );
        return res.redirect('/circulation');
      }

      // 1. Mark issue returned
      await conn.query(
        'UPDATE issue SET return_date = CURDATE() WHERE issue_id = ?',
        [issueId],
      );

      // 2. Increment book available copies
      await conn.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?',
        [issue.book_id],
      );

      // 3. Record fine if overdue
      const overdueDays = Math.max(0, Number(issue.days_overdue) || 0);
      let fineRecorded = 0;
      if (overdueDays > 0) {
        fineRecorded = overdueDays * 2; // ₹2 per day policy
        const [[existingFine]] = await conn.query(
          'SELECT fine_id FROM fine WHERE issue_id = ?',
          [issueId],
        );
        if (existingFine) {
          await conn.query(
            'UPDATE fine SET amount = ?, paid_status = "unpaid" WHERE fine_id = ?',
            [fineRecorded, existingFine.fine_id],
          );
        } else {
          await conn.query(
            'INSERT INTO fine (issue_id, amount, paid_status) VALUES (?, ?, "unpaid")',
            [issueId, fineRecorded],
          );
        }
      }

      await conn.commit();

      if (fineRecorded > 0) {
        req.flash(
          'success',
          `Book "${issue.book_title}" returned. Overdue fine of ₹${fineRecorded} recorded for ${issue.member_name}.`,
        );
      } else {
        req.flash(
          'success',
          `Book "${issue.book_title}" returned successfully.`,
        );
      }
      res.redirect('/circulation');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }),
);

module.exports = router;
