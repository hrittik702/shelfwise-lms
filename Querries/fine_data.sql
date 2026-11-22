-- =====================================================================
-- ShelfWise: Synchronized Circulation & Fine Transaction Seed Data
-- Reflects realistic historical and active loans with both returned
-- and unreturned books, complete with fine ledger sync.
-- =====================================================================

-- 1. Circulation Records (Issues 1-13)
DELETE FROM fine;
DELETE FROM issue;

INSERT INTO issue (issue_id, book_id, member_id, staff_id, issue_date, due_date, return_date) VALUES
  (1, 1, 41, 1, '2026-09-04', '2026-09-18', '2026-09-28'),
  (2, 5, 50, 1, '2026-09-11', '2026-09-25', '2026-10-05'),
  (3, 7, 35, 1, '2026-09-19', '2026-10-03', '2026-10-11'),
  (4, 1, 50, 2, '2026-10-19', '2026-11-02', NULL),
  (5, 2, 43, 2, '2026-09-30', '2026-10-14', '2026-10-26'),
  (6, 2, 50, 2, '2026-10-04', '2026-10-18', '2026-10-30'),
  (7, 5, 66, 1, '2026-10-09', '2026-10-23', '2026-11-03'),
  (8, 2, 41, 2, '2026-10-24', '2026-11-07', NULL),
  (9, 4, 55, 2, '2026-10-14', '2026-10-28', '2026-10-26'),
  (10, 4, 16, 2, '2026-10-14', '2026-10-28', '2026-10-27'),
  (11, 5, 7, 1, '2026-10-27', '2026-11-10', NULL),
  (12, 7, 10, 1, '2026-10-30', '2026-11-13', NULL),
  (13, 4, 3, 2, '2026-11-11', '2026-11-25', NULL);

-- 2. Fine Records (Fines 1-10: 3 Paid Returned, 3 Unpaid Returned, 4 Unpaid Active/Unreturned)
INSERT INTO fine (fine_id, issue_id, amount, paid_status, paid_date) VALUES
  (1, 1, 20, 'paid', '2026-09-29'),
  (2, 2, 20, 'paid', '2026-10-06'),
  (3, 3, 16, 'paid', '2026-10-13'),
  (4, 5, 24, 'unpaid', NULL),
  (5, 6, 24, 'unpaid', NULL),
  (6, 7, 22, 'unpaid', NULL),
  (7, 4, 28, 'unpaid', NULL),
  (8, 8, 18, 'unpaid', NULL),
  (9, 11, 12, 'unpaid', NULL),
  (10, 12, 6, 'unpaid', NULL);

-- 3. Stock Consistency Maintenance
UPDATE books b SET available_copies = b.total_copies - (
  SELECT COUNT(*) FROM issue i WHERE i.book_id = b.book_id AND i.return_date IS NULL
);
