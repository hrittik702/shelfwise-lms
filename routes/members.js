const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');

// List all members
router.get(
  '/',
  wrapAsync(async (req, res) => {
    const sql = `
      SELECT m.*, COUNT(i.issue_id) AS active_loans
      FROM members m
      LEFT JOIN issue i ON i.member_id = m.member_id AND i.return_date IS NULL
      GROUP BY m.member_id
      ORDER BY m.member_id ASC
    `;
    const [members] = await db.query(sql);
    res.render('members/members.ejs', { members });
  }),
);

// new.ejs for adding new member
router.get(
  '/new',
  wrapAsync(async (req, res) => {
    res.render('members/new.ejs');
  }),
);

router.post(
  '/',
  wrapAsync(async (req, res) => {
    const { name, email, phone, member_type } = req.body;
    const sql = `INSERT INTO members (name,email,phone,member_type,join_date,status) values (?,?,?,?,CURDATE(),"active")`;
    await db.query(sql, [name, email, phone, member_type]);
    res.redirect('/members');
  }),
);

// view single member details
router.get(
  '/:member_id',
  wrapAsync(async (req, res) => {
    const member_id = Number(req.params.member_id);
    if (!Number.isSafeInteger(member_id) || member_id <= 0) {
      return res.status(400).send('Invalid member ID');
    }
    const sql = `
      SELECT m.*,
        (SELECT COUNT(*) FROM issue i WHERE i.member_id = m.member_id AND i.return_date IS NULL) AS active_loans,
        (SELECT COUNT(*) FROM issue i WHERE i.member_id = m.member_id) AS total_issues,
        (SELECT COALESCE(SUM(f.amount), 0) FROM fine f JOIN issue i ON i.issue_id = f.issue_id WHERE i.member_id = m.member_id AND f.paid_status = 'unpaid') AS unpaid_fines
      FROM members m
      WHERE m.member_id = ?
    `;
    const [rows] = await db.query(sql, [member_id]);
    const member = rows[0];
    if (!member) {
      return res.status(404).send('Member not found');
    }
    const [activeLoans] = await db.query(
      `SELECT i.issue_id, i.book_id, i.issue_date, i.due_date,
              DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
              b.title AS book_title, b.author, b.isbn
       FROM issue i
       JOIN books b ON b.book_id = i.book_id
       WHERE i.member_id = ? AND i.return_date IS NULL
       ORDER BY i.due_date ASC`,
      [member_id],
    );
    res.render('members/view.ejs', { member, activeLoans: activeLoans || [] });
  }),
);

// update member ejs and update post
router.get(
  '/:member_id/update',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `select * from members where member_id = ?`;
    const [rows] = await db.query(sql, [member_id]);
    res.render('members/update.ejs', { member: rows[0] });
  }),
);

router.post(
  '/:member_id/update',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `update members set name = ?, email = ?, phone =?, member_type = ?,status = ? WHERE member_id = ?`;
    const { name, email, phone, member_type, status } = req.body;
    const result = await db.query(sql, [
      name,
      email,
      phone,
      member_type,
      status,
      member_id,
    ]);
    res.redirect(`/members/${member_id}`);
  }),
);

// member delete
router.post(
  '/:member_id/delete',
  wrapAsync(async (req, res) => {
    const member_id = Number(req.params.member_id);
    if (!Number.isSafeInteger(member_id) || member_id <= 0) {
      req.flash('error', 'Invalid member ID.');
      return res.redirect('/members');
    }
    const [loanRows] = await db.query(
      'SELECT COUNT(*) AS active FROM issue WHERE member_id = ? AND return_date IS NULL',
      [member_id],
    );
    if (loanRows[0] && loanRows[0].active > 0) {
      req.flash(
        'error',
        `Cannot delete member with ${loanRows[0].active} active loan(s).`,
      );
      return res.redirect(`/members/${member_id}`);
    }
    await db.query('DELETE FROM members WHERE member_id = ?', [member_id]);
    req.flash('success', 'Member deleted successfully.');
    res.redirect('/members');
  }),
);

module.exports = router;
