const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const db = require('../config/db.js');

// List all members
router.get(
  '/',
  wrapAsync(async (req, res) => {
    const sql = 'SELECT * from members';
    const [members] = await db.query(sql);
    res.render('members/members.ejs', { members });
  })
);

// new.ejs for adding new member
router.get(
  '/new',
  wrapAsync(async (req, res) => {
    res.render('members/new.ejs');
  })
);

router.post(
  '/',
  wrapAsync(async (req, res) => {
    const { name, email, phone, member_type } = req.body;
    const sql = `INSERT INTO members (name,email,phone,member_type,join_date,status) values (?,?,?,?,CURDATE(),"active")`;
    await db.query(sql, [name, email, phone, member_type]);
    res.redirect('/members');
  })
);

// view single member details
router.get(
  '/:member_id',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `select * from members where member_id = ?`;
    const [rows] = await db.query(sql, [member_id]);
    res.render('members/view.ejs', { member: rows[0] });
  })
);

// update member ejs and update post
router.get(
  '/:member_id/update',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `select * from members where member_id = ?`;
    const [rows] = await db.query(sql, [member_id]);
    res.render('members/update.ejs', { member: rows[0] });
  })
);

router.post(
  '/:member_id/update',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `update members set name = ?, email = ?, phone =?, member_type = ?,status = ? WHERE member_id = ?`;
    const { name, email, phone, member_type, status } = req.body;
    const result = await db.query(sql, [name, email, phone, member_type, status, member_id]);
    res.redirect(`/members/${member_id}`);
  })
);

// member delete
// Fix  : change the request method to ?method_override=DELETE
router.post(
  '/:member_id/delete',
  wrapAsync(async (req, res) => {
    const member_id = req.params.member_id;
    const sql = `delete from members where member_id = ?`;
    await db.query(sql, [member_id]);
    res.redirect('/members');
  })
);

module.exports = router;
