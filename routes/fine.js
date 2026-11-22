const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/expressError.js');
const db = require('../config/db.js');

// ============================================================================
// 1. View All Fine Transactions (GET /fine or GET /fines)
// ============================================================================
router.get(
  '/',
  wrapAsync(async (req, res) => {
    // 1. Fetch all fine transaction records joined with issue, books, members, staff
    const [fines] = await db.query(`
      SELECT 
        f.fine_id,
        f.issue_id,
        f.amount,
        f.paid_status,
        f.paid_date,
        i.book_id,
        i.member_id,
        i.staff_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        DATEDIFF(COALESCE(i.return_date, CURDATE()), i.due_date) AS days_overdue,
        b.title AS book_title,
        b.isbn,
        b.author,
        m.name AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        m.member_type,
        m.status AS member_status,
        s.name AS staff_name
      FROM fine f
      JOIN issue i ON f.issue_id = i.issue_id
      JOIN books b ON i.book_id = b.book_id
      JOIN members m ON i.member_id = m.member_id
      LEFT JOIN staff s ON i.staff_id = s.staff_id
      ORDER BY 
        CASE WHEN f.paid_status = 'unpaid' THEN 0 ELSE 1 END,
        f.fine_id DESC
    `);

    // 2. Fetch aggregate statistics across fines table
    const [[statsRow]] = await db.query(`
      SELECT 
        COUNT(*) AS total_fines,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN paid_status = 'unpaid' THEN 1 ELSE 0 END), 0) AS unpaid_count,
        COALESCE(SUM(CASE WHEN paid_status = 'unpaid' THEN amount ELSE 0 END), 0) AS unpaid_amount,
        COALESCE(SUM(CASE WHEN paid_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_count,
        COALESCE(SUM(CASE WHEN paid_status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount
      FROM fine
    `);

    // 3. Count active unreturned loans that are currently overdue (accumulating daily fines)
    const [[overdueLoansRow]] = await db.query(`
      SELECT COUNT(*) AS active_overdue
      FROM issue
      WHERE return_date IS NULL AND due_date < CURDATE()
    `);

    // 4. Fetch recent circulation issues for the manual fine assessment modal
    const [eligibleIssues] = await db.query(`
      SELECT 
        i.issue_id,
        i.book_id,
        i.member_id,
        b.title AS book_title,
        m.name AS member_name,
        m.member_type,
        i.issue_date,
        i.due_date,
        i.return_date,
        DATEDIFF(COALESCE(i.return_date, CURDATE()), i.due_date) AS days_overdue
      FROM issue i
      JOIN books b ON i.book_id = b.book_id
      JOIN members m ON i.member_id = m.member_id
      ORDER BY i.issue_id DESC
      LIMIT 100
    `);

    const stats = {
      totalFines: Number(statsRow.total_fines) || 0,
      totalAmount: Number(statsRow.total_amount) || 0,
      unpaidCount: Number(statsRow.unpaid_count) || 0,
      unpaidAmount: Number(statsRow.unpaid_amount) || 0,
      paidCount: Number(statsRow.paid_count) || 0,
      paidAmount: Number(statsRow.paid_amount) || 0,
      activeOverdueLoansCount: Number(overdueLoansRow.active_overdue) || 0,
    };

    res.render('fine/fine.ejs', {
      fines,
      stats,
      eligibleIssues,
    });
  }),
);

// ============================================================================
// 2. Collect / Mark Fine as Paid (POST /fine/:fine_id/pay)
// ============================================================================
router.post(
  '/:fine_id/pay',
  wrapAsync(async (req, res) => {
    const fineId = Number(req.params.fine_id);
    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      req.flash('error', 'Invalid fine transaction ID.');
      return res.redirect('/fine');
    }

    const [[fine]] = await db.query(
      `SELECT f.*, b.title AS book_title, m.name AS member_name, m.member_id
       FROM fine f
       JOIN issue i ON f.issue_id = i.issue_id
       JOIN books b ON i.book_id = b.book_id
       JOIN members m ON i.member_id = m.member_id
       WHERE f.fine_id = ?`,
      [fineId],
    );

    if (!fine) {
      req.flash('error', 'Fine transaction record not found.');
      return res.redirect('/fine');
    }

    if (fine.paid_status === 'paid') {
      req.flash('info', `Fine #${fineId} has already been settled and marked as paid.`);
      return res.redirect('/fine');
    }

    await db.query(
      'UPDATE fine SET paid_status = "paid", paid_date = CURDATE() WHERE fine_id = ?',
      [fineId],
    );

    req.flash(
      'success',
      `Payment of ₹${fine.amount} for "${fine.book_title}" (${fine.member_name}) collected and settled successfully.`,
    );
    res.redirect('/fine');
  }),
);

// ============================================================================
// 3. Revert Fine Payment to Unpaid (POST /fine/:fine_id/unpay)
// ============================================================================
router.post(
  '/:fine_id/unpay',
  wrapAsync(async (req, res) => {
    const fineId = Number(req.params.fine_id);
    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      req.flash('error', 'Invalid fine transaction ID.');
      return res.redirect('/fine');
    }

    const [[fine]] = await db.query(
      `SELECT f.*, b.title AS book_title, m.name AS member_name
       FROM fine f
       JOIN issue i ON f.issue_id = i.issue_id
       JOIN books b ON i.book_id = b.book_id
       JOIN members m ON i.member_id = m.member_id
       WHERE f.fine_id = ?`,
      [fineId],
    );

    if (!fine) {
      req.flash('error', 'Fine record not found.');
      return res.redirect('/fine');
    }

    await db.query(
      'UPDATE fine SET paid_status = "unpaid", paid_date = NULL WHERE fine_id = ?',
      [fineId],
    );

    req.flash(
      'warning',
      `Fine #${fineId} for ${fine.member_name} reverted to unpaid status.`,
    );
    res.redirect('/fine');
  }),
);

// ============================================================================
// 4. Record / Assess a Fine on a Circulation Record (POST /fine/record)
// ============================================================================
router.post(
  '/record',
  wrapAsync(async (req, res) => {
    const { issue_id, amount, paid_status } = req.body;
    const issueId = Number(issue_id);
    const fineAmount = Math.max(0, parseInt(amount, 10) || 0);
    const status = paid_status === 'paid' ? 'paid' : 'unpaid';

    if (!issueId || fineAmount <= 0) {
      req.flash(
        'error',
        'Please select a valid circulation record and enter a fine amount greater than ₹0.',
      );
      return res.redirect('/fine');
    }

    // Verify issue exists
    const [[issue]] = await db.query(
      `SELECT i.*, b.title AS book_title, m.name AS member_name 
       FROM issue i
       JOIN books b ON i.book_id = b.book_id
       JOIN members m ON i.member_id = m.member_id
       WHERE i.issue_id = ?`,
      [issueId],
    );

    if (!issue) {
      req.flash('error', 'Selected circulation issue record was not found.');
      return res.redirect('/fine');
    }

    // Check if fine already exists for this issue
    const [[existingFine]] = await db.query(
      'SELECT fine_id FROM fine WHERE issue_id = ?',
      [issueId],
    );

    if (existingFine) {
      await db.query(
        'UPDATE fine SET amount = ?, paid_status = ?, paid_date = ? WHERE fine_id = ?',
        [
          fineAmount,
          status,
          status === 'paid' ? new Date() : null,
          existingFine.fine_id,
        ],
      );
      req.flash(
        'success',
        `Existing fine #${existingFine.fine_id} for "${issue.book_title}" updated to ₹${fineAmount} (${status}).`,
      );
    } else {
      await db.query(
        'INSERT INTO fine (issue_id, amount, paid_status, paid_date) VALUES (?, ?, ?, ?)',
        [
          issueId,
          fineAmount,
          status,
          status === 'paid' ? new Date() : null,
        ],
      );
      req.flash(
        'success',
        `Fine of ₹${fineAmount} recorded for "${issue.book_title}" (${issue.member_name}).`,
      );
    }

    res.redirect('/fine');
  }),
);

module.exports = router;
