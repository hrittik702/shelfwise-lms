const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');

const { getPage, pageInfo, likeTerm } = require('../utils/paginate');
const FINE_PER_DAY = 2;

// ---------- current loans ----------
router.get(
  '/',
  wrapAsync(async (req, res) => {
    const filter = ['overdue', 'today'].includes(req.query.filter) ? req.query.filter : 'all';
    const cond =
      filter === 'overdue'
        ? 'AND due_date < CURDATE()'
        : filter === 'today'
          ? 'AND due_date = CURDATE()'
          : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM issue_details WHERE return_date IS NULL ${cond}`
    );
    const [[counts]] = await db.query(`
    SELECT COUNT(*) AS \`all\`,
           SUM(due_date < CURDATE()) AS overdue,
           SUM(due_date = CURDATE()) AS today
    FROM issue_details WHERE return_date IS NULL`);

    const pg = pageInfo(total, getPage(req));
    const [issues] = await db.query(
      `SELECT *, DATEDIFF(CURDATE(), due_date) AS days_overdue
     FROM issue_details WHERE return_date IS NULL ${cond}
     ORDER BY due_date ASC, issue_id LIMIT ? OFFSET ?`,
      [pg.limit, pg.offset]
    );

    res.render('circulation/view.ejs', { issues, filter, counts, ...pg });
  })
);

// ---------- return desk ----------
router.get(
  '/return',
  wrapAsync(async (req, res) => {
    const q = String(req.query.q || '')
      .trim()
      .slice(0, 50);
    const sel = Number.parseInt(req.query.issue_id, 10);
    const selectedIssueId = Number.isSafeInteger(sel) && sel > 0 ? sel : '';

    const where = ['i.return_date IS NULL'];
    const params = [];
    if (q) {
      const t = likeTerm(q);
      where.push('(b.title LIKE ? OR b.isbn LIKE ? OR m.name LIKE ?)');
      params.push(t, t, t);
    }
    const from = `FROM issue i JOIN books b ON b.book_id = i.book_id
                JOIN members m ON m.member_id = i.member_id WHERE ${where.join(' AND ')}`;

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${from}`, params);
    const pg = pageInfo(total, getPage(req));

    const [loans] = await db.query(
      `SELECT i.issue_id, b.book_id, b.title AS book_title, b.isbn,
            m.member_id, m.name AS member_name, m.member_type, m.phone,
            i.issue_date, i.due_date,
            GREATEST(DATEDIFF(CURDATE(), i.due_date), 0) AS days_overdue
     ${from} ORDER BY days_overdue DESC, i.due_date LIMIT ? OFFSET ?`,
      [...params, pg.limit, pg.offset]
    );

    res.render('circulation/return.ejs', { loans, q, selectedIssueId, ...pg });
  })
);

router.post(
  '/return/:issue_id',
  wrapAsync(async (req, res) => {
    const issueId = Number(req.params.issue_id);
    if (!Number.isSafeInteger(issueId) || issueId <= 0)
      return res.status(400).send('Invalid issue ID');

    const conn = await db.getConnection();
    let error = null;
    let fine = 0;
    try {
      await conn.beginTransaction();
      const [[loan]] = await conn.query(
        `SELECT issue_id, book_id, return_date,
              GREATEST(DATEDIFF(CURDATE(), due_date), 0) AS days_late
       FROM issue WHERE issue_id = ? FOR UPDATE`,
        [issueId]
      );

      if (!loan) error = 'Loan not found.';
      else if (loan.return_date) error = 'This book was already returned.';

      if (error) {
        await conn.rollback();
      } else {
        fine = loan.days_late * FINE_PER_DAY;
        await conn.query('UPDATE issue SET return_date = CURDATE() WHERE issue_id = ?', [issueId]);
        await conn.query(
          'UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?',
          [loan.book_id]
        );
        if (fine > 0) {
          await conn.query(
            "INSERT INTO fine (issue_id, amount, paid_status) VALUES (?, ?, 'unpaid')",
            [issueId, fine]
          );
        }
        await conn.commit();
      }
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    if (error) req.flash('error', error);
    else
      req.flash(
        'success',
        fine > 0 ? `Returned late. Fine recorded: ₹${fine}.` : 'Returned on time. No fine.'
      );
    res.redirect('/circulation/return');
  })
);

// ---------- overdue ----------
router.get(
  '/overdue',
  wrapAsync(async (req, res) => {
    const [[totals]] = await db.query(
      `SELECT COUNT(*) AS count,
            COALESCE(SUM(DATEDIFF(CURDATE(), due_date)), 0) * ? AS est_fine
     FROM issue WHERE return_date IS NULL AND due_date < CURDATE()`,
      [FINE_PER_DAY]
    );

    const pg = pageInfo(totals.count, getPage(req));
    const [loans] = await db.query(
      `SELECT i.issue_id, b.book_id, b.title AS book_title, b.isbn,
            m.member_id, m.name AS member_name, m.member_type, m.phone,
            i.due_date, DATEDIFF(CURDATE(), i.due_date) AS days_overdue
     FROM issue i JOIN books b ON b.book_id = i.book_id JOIN members m ON m.member_id = i.member_id
     WHERE i.return_date IS NULL AND i.due_date < CURDATE()
     ORDER BY days_overdue DESC, i.issue_id LIMIT ? OFFSET ?`,
      [pg.limit, pg.offset]
    );

    res.render('circulation/overdue.ejs', { loans, totals, ...pg });
  })
);

// ---------- fines ----------
router.get(
  '/fines',
  wrapAsync(async (req, res) => {
    const status = ['unpaid', 'paid'].includes(req.query.status) ? req.query.status : 'all';
    const cond = status === 'all' ? '' : 'WHERE f.paid_status = ?';
    const params = status === 'all' ? [] : [status];

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM fine f ${cond}`, params);
    const [[totals]] = await db.query(`
    SELECT COALESCE(SUM(CASE WHEN paid_status = 'unpaid' THEN amount END), 0) AS unpaid,
           COALESCE(SUM(CASE WHEN paid_status = 'paid' THEN amount END), 0) AS collected
    FROM fine`);

    const pg = pageInfo(total, getPage(req));
    const [fines] = await db.query(
      `SELECT f.fine_id, f.issue_id, m.member_id, m.name AS member_name, m.member_type,
            b.book_id, b.title AS book_title, f.amount,
            f.paid_status AS status, i.return_date AS created_at, f.paid_date AS paid_at
     FROM fine f JOIN issue i ON i.issue_id = f.issue_id
     JOIN books b ON b.book_id = i.book_id JOIN members m ON m.member_id = i.member_id
     ${cond} ORDER BY (f.paid_status = 'unpaid') DESC, f.fine_id DESC LIMIT ? OFFSET ?`,
      [...params, pg.limit, pg.offset]
    );

    res.render('circulation/fines.ejs', { fines, status, totals, ...pg });
  })
);

router.post(
  '/fines/:fine_id/pay',
  wrapAsync(async (req, res) => {
    const id = Number(req.params.fine_id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).send('Invalid fine ID');

    const [result] = await db.query(
      "UPDATE fine SET paid_status = 'paid', paid_date = CURDATE() WHERE fine_id = ? AND paid_status = 'unpaid'",
      [id]
    );
    req.flash(
      result.affectedRows ? 'success' : 'error',
      result.affectedRows ? 'Fine marked as paid.' : 'Fine not found or already paid.'
    );
    res.redirect('/circulation/fines');
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
