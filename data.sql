-- ShelfWise sample data
-- Run this AFTER creating the tables in your schema.sql.
-- Designed for the user's current table/column names: staff, category, books, members, issue, fine.
-- Demo staff login password for all five accounts: ShelfWise@123
-- The password values below are bcrypt hashes, not plaintext passwords.
-- Dates use CURDATE() so current/overdue examples remain useful when you import later.
-- The ISBN values are synthetic 13-digit examples for SQL practice, not real book-edition ISBNs.

START TRANSACTION;

-- 1) STAFF (5 records)
INSERT INTO staff (staff_id, name, username, password) VALUES
(1, 'Aditi Verma', 'aditi.verma', '$2b$12$iyjuyhPijPWDJUlgbEzHIur4o6IHB2tkMj4uN/G5f1jQ6Hg6faJTq'),
(2, 'Rahul Singh', 'rahul.singh', '$2b$12$iyjuyhPijPWDJUlgbEzHIur4o6IHB2tkMj4uN/G5f1jQ6Hg6faJTq'),
(3, 'Neha Gupta', 'neha.gupta', '$2b$12$iyjuyhPijPWDJUlgbEzHIur4o6IHB2tkMj4uN/G5f1jQ6Hg6faJTq'),
(4, 'Arjun Mishra', 'arjun.mishra', '$2b$12$iyjuyhPijPWDJUlgbEzHIur4o6IHB2tkMj4uN/G5f1jQ6Hg6faJTq'),
(5, 'Priya Khan', 'priya.khan', '$2b$12$iyjuyhPijPWDJUlgbEzHIur4o6IHB2tkMj4uN/G5f1jQ6Hg6faJTq');

-- 2) CATEGORY (12 records)
INSERT INTO category (category_id, category_name) VALUES
(1, 'Programming'),
(2, 'Database Systems'),
(3, 'Algorithms'),
(4, 'Web Development'),
(5, 'Operating Systems'),
(6, 'Networking'),
(7, 'AI & ML'),
(8, 'Mathematics'),
(9, 'Physics'),
(10, 'Literature'),
(11, 'History'),
(12, 'Cybersecurity');

-- 3) BOOKS (30 records); available copies agree with the active issue records below.
INSERT INTO books (book_id, isbn, title, author, publisher, pub_year, category_id, total_copies, available_copies) VALUES
(1, '9780000000019', 'The C++ Programming Language', 'Bjarne Stroustrup', 'Addison-Wesley', 2013, 1, 2, 0),
(2, '9780000000026', 'Effective Modern C++', 'Scott Meyers', 'O Reilly Media', 2014, 1, 4, 3),
(3, '9780000000033', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, 1, 2, 0),
(4, '9780000000040', 'Head First Java', 'Kathy Sierra', 'O Reilly Media', 2022, 1, 4, 3),
(5, '9780000000057', 'Database System Concepts', 'Abraham Silberschatz', 'McGraw-Hill', 2019, 2, 5, 4),
(6, '9780000000064', 'Fundamentals of DB Systems', 'Ramez Elmasri', 'Pearson', 2016, 2, 4, 3),
(7, '9780000000071', 'SQL in 10 Minutes', 'Ben Forta', 'Sams', 2022, 2, 3, 2),
(8, '9780000000088', 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', 2022, 3, 4, 3),
(9, '9780000000095', 'Algorithm Design', 'Jon Kleinberg', 'Pearson', 2005, 3, 3, 2),
(10, '9780000000101', 'Data Structures and Algorithms', 'Michael Goodrich', 'Wiley', 2014, 3, 5, 4),
(11, '9780000000118', 'Eloquent JavaScript', 'Marijn Haverbeke', 'No Starch Press', 2018, 4, 4, 3),
(12, '9780000000125', 'You Don''t Know JS', 'Kyle Simpson', 'O Reilly Media', 2020, 4, 4, 3),
(13, '9780000000132', 'HTML and CSS', 'Jon Duckett', 'Wiley', 2011, 4, 3, 2),
(14, '9780000000149', 'Learning PHP', 'David Sklar', 'O Reilly Media', 2016, 4, 4, 3),
(15, '9780000000156', 'Operating System Concepts', 'Abraham Silberschatz', 'Wiley', 2018, 5, 3, 2),
(16, '9780000000163', 'Computer Networks', 'Andrew Tanenbaum', 'Pearson', 2021, 6, 5, 4),
(17, '9780000000170', 'Computer Organization', 'Carl Hamacher', 'McGraw-Hill', 2011, 5, 4, 4),
(18, '9780000000187', 'Artificial Intelligence', 'Stuart Russell', 'Pearson', 2020, 7, 4, 4),
(19, '9780000000194', 'Hands-On Machine Learning', 'Aurelien Geron', 'O Reilly Media', 2022, 7, 5, 5),
(20, '9780000000200', 'Deep Learning', 'Ian Goodfellow', 'MIT Press', 2016, 7, 3, 3),
(21, '9780000000217', 'Discrete Mathematics', 'Kenneth Rosen', 'McGraw-Hill', 2018, 8, 5, 5),
(22, '9780000000224', 'Engineering Mathematics', 'B. S. Grewal', 'Khanna Publishers', 2020, 8, 6, 6),
(23, '9780000000231', 'University Physics', 'Young and Freedman', 'Pearson', 2019, 9, 4, 4),
(24, '9780000000248', 'A Brief History of Time', 'Stephen Hawking', 'Bantam', 1998, 10, 3, 3),
(25, '9780000000255', 'The Alchemist', 'Paulo Coelho', 'HarperOne', 2014, 10, 5, 5),
(26, '9780000000262', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 2006, 10, 3, 3),
(27, '9780000000279', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 2004, 10, 4, 4),
(28, '9780000000286', 'Sapiens', 'Yuval Noah Harari', 'Harper', 2015, 11, 4, 4),
(29, '9780000000293', 'Cybersecurity Essentials', 'Charles J. Brooks', 'Cisco Press', 2018, 12, 3, 3),
(30, '9780000000309', 'Computer Architecture', 'John L. Hennessy', 'Morgan Kaufmann', 2017, 5, 4, 4);

-- 4) MEMBERS (30 records; includes active and suspended accounts, students and faculty).
INSERT INTO members (member_id, name, email, phone, member_type, join_date, status) VALUES
(1, 'Ananya Sharma', 'member01@shelfwise.example', '9876500001', 'student', DATE_SUB(CURDATE(), INTERVAL 57 DAY), 'active'),
(2, 'Rohan Singh', 'member02@shelfwise.example', '9876500002', 'student', DATE_SUB(CURDATE(), INTERVAL 74 DAY), 'active'),
(3, 'Ishita Gupta', 'member03@shelfwise.example', '9876500003', 'student', DATE_SUB(CURDATE(), INTERVAL 91 DAY), 'active'),
(4, 'Aditya Verma', 'member04@shelfwise.example', '9876500004', 'student', DATE_SUB(CURDATE(), INTERVAL 108 DAY), 'active'),
(5, 'Kavya Mishra', 'member05@shelfwise.example', '9876500005', 'student', DATE_SUB(CURDATE(), INTERVAL 125 DAY), 'active'),
(6, 'Arnav Yadav', 'member06@shelfwise.example', '9876500006', 'student', DATE_SUB(CURDATE(), INTERVAL 142 DAY), 'active'),
(7, 'Meera Khan', 'member07@shelfwise.example', '9876500007', 'student', DATE_SUB(CURDATE(), INTERVAL 159 DAY), 'active'),
(8, 'Vivaan Patel', 'member08@shelfwise.example', '9876500008', 'student', DATE_SUB(CURDATE(), INTERVAL 176 DAY), 'active'),
(9, 'Sana Reddy', 'member09@shelfwise.example', '9876500009', 'student', DATE_SUB(CURDATE(), INTERVAL 193 DAY), 'active'),
(10, 'Reyansh Joshi', 'member10@shelfwise.example', '9876500010', 'student', DATE_SUB(CURDATE(), INTERVAL 210 DAY), 'active'),
(11, 'Diya Das', 'member11@shelfwise.example', '9876500011', 'student', DATE_SUB(CURDATE(), INTERVAL 227 DAY), 'active'),
(12, 'Aarav Chauhan', 'member12@shelfwise.example', '9876500012', 'student', DATE_SUB(CURDATE(), INTERVAL 244 DAY), 'active'),
(13, 'Nisha Malhotra', 'member13@shelfwise.example', '9876500013', 'student', DATE_SUB(CURDATE(), INTERVAL 261 DAY), 'active'),
(14, 'Kabir Saxena', 'member14@shelfwise.example', '9876500014', 'student', DATE_SUB(CURDATE(), INTERVAL 278 DAY), 'active'),
(15, 'Priya Kapoor', 'member15@shelfwise.example', '9876500015', 'student', DATE_SUB(CURDATE(), INTERVAL 295 DAY), 'active'),
(16, 'Ira Bose', 'member16@shelfwise.example', '9876500016', 'student', DATE_SUB(CURDATE(), INTERVAL 312 DAY), 'active'),
(17, 'Dev Jain', 'member17@shelfwise.example', '9876500017', 'student', DATE_SUB(CURDATE(), INTERVAL 329 DAY), 'active'),
(18, 'Simran Sinha', 'member18@shelfwise.example', '9876500018', 'student', DATE_SUB(CURDATE(), INTERVAL 346 DAY), 'active'),
(19, 'Manav Agarwal', 'member19@shelfwise.example', '9876500019', 'student', DATE_SUB(CURDATE(), INTERVAL 363 DAY), 'suspended'),
(20, 'Tanya Roy', 'member20@shelfwise.example', '9876500020', 'student', DATE_SUB(CURDATE(), INTERVAL 380 DAY), 'active'),
(21, 'Yash Pandey', 'member21@shelfwise.example', '9876500021', 'student', DATE_SUB(CURDATE(), INTERVAL 397 DAY), 'active'),
(22, 'Aisha Kulkarni', 'member22@shelfwise.example', '9876500022', 'student', DATE_SUB(CURDATE(), INTERVAL 414 DAY), 'suspended'),
(23, 'Kunal Bansal', 'member23@shelfwise.example', '9876500023', 'student', DATE_SUB(CURDATE(), INTERVAL 431 DAY), 'active'),
(24, 'Riya Mehta', 'member24@shelfwise.example', '9876500024', 'student', DATE_SUB(CURDATE(), INTERVAL 448 DAY), 'active'),
(25, 'Dr. Pooja Verma', 'member25@shelfwise.example', '9876500025', 'faculty', DATE_SUB(CURDATE(), INTERVAL 465 DAY), 'active'),
(26, 'Prof. Sameer Shah', 'member26@shelfwise.example', '9876500026', 'faculty', DATE_SUB(CURDATE(), INTERVAL 482 DAY), 'active'),
(27, 'Dr. Meenal Rao', 'member27@shelfwise.example', '9876500027', 'faculty', DATE_SUB(CURDATE(), INTERVAL 499 DAY), 'active'),
(28, 'Prof. Karan Khanna', 'member28@shelfwise.example', '9876500028', 'faculty', DATE_SUB(CURDATE(), INTERVAL 516 DAY), 'suspended'),
(29, 'Dr. Nitin Chopra', 'member29@shelfwise.example', '9876500029', 'faculty', DATE_SUB(CURDATE(), INTERVAL 533 DAY), 'active'),
(30, 'Prof. Shreya Iyer', 'member30@shelfwise.example', '9876500030', 'faculty', DATE_SUB(CURDATE(), INTERVAL 550 DAY), 'active');

-- 5) ISSUE (50 records: 32 returned historical loans and 18 active loans).
-- Active loans are issued to active members. Six active loans are overdue; their fines are not inserted yet because your rule creates a fine on return.
INSERT INTO issue (issue_id, book_id, member_id, staff_id, issue_date, due_date, return_date) VALUES
(1, 5, 1, 1, DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 76 DAY), DATE_SUB(CURDATE(), INTERVAL 77 DAY)),
(2, 1, 2, 2, DATE_SUB(CURDATE(), INTERVAL 80 DAY), DATE_SUB(CURDATE(), INTERVAL 66 DAY), DATE_SUB(CURDATE(), INTERVAL 61 DAY)),
(3, 2, 3, 1, DATE_SUB(CURDATE(), INTERVAL 75 DAY), DATE_SUB(CURDATE(), INTERVAL 61 DAY), DATE_SUB(CURDATE(), INTERVAL 61 DAY)),
(4, 7, 4, 3, DATE_SUB(CURDATE(), INTERVAL 70 DAY), DATE_SUB(CURDATE(), INTERVAL 56 DAY), DATE_SUB(CURDATE(), INTERVAL 50 DAY)),
(5, 8, 5, 2, DATE_SUB(CURDATE(), INTERVAL 68 DAY), DATE_SUB(CURDATE(), INTERVAL 54 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY)),
(6, 10, 6, 4, DATE_SUB(CURDATE(), INTERVAL 65 DAY), DATE_SUB(CURDATE(), INTERVAL 51 DAY), DATE_SUB(CURDATE(), INTERVAL 49 DAY)),
(7, 4, 7, 5, DATE_SUB(CURDATE(), INTERVAL 63 DAY), DATE_SUB(CURDATE(), INTERVAL 49 DAY), DATE_SUB(CURDATE(), INTERVAL 39 DAY)),
(8, 11, 8, 1, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 46 DAY), DATE_SUB(CURDATE(), INTERVAL 46 DAY)),
(9, 12, 9, 3, DATE_SUB(CURDATE(), INTERVAL 58 DAY), DATE_SUB(CURDATE(), INTERVAL 44 DAY), DATE_SUB(CURDATE(), INTERVAL 40 DAY)),
(10, 3, 10, 2, DATE_SUB(CURDATE(), INTERVAL 55 DAY), DATE_SUB(CURDATE(), INTERVAL 41 DAY), DATE_SUB(CURDATE(), INTERVAL 27 DAY)),
(11, 13, 11, 4, DATE_SUB(CURDATE(), INTERVAL 53 DAY), DATE_SUB(CURDATE(), INTERVAL 39 DAY), DATE_SUB(CURDATE(), INTERVAL 46 DAY)),
(12, 14, 12, 5, DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 36 DAY), DATE_SUB(CURDATE(), INTERVAL 29 DAY)),
(13, 15, 13, 1, DATE_SUB(CURDATE(), INTERVAL 48 DAY), DATE_SUB(CURDATE(), INTERVAL 34 DAY), DATE_SUB(CURDATE(), INTERVAL 33 DAY)),
(14, 16, 14, 3, DATE_SUB(CURDATE(), INTERVAL 46 DAY), DATE_SUB(CURDATE(), INTERVAL 32 DAY), DATE_SUB(CURDATE(), INTERVAL 16 DAY)),
(15, 17, 15, 2, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), DATE_SUB(CURDATE(), INTERVAL 33 DAY)),
(16, 18, 16, 4, DATE_SUB(CURDATE(), INTERVAL 43 DAY), DATE_SUB(CURDATE(), INTERVAL 29 DAY), DATE_SUB(CURDATE(), INTERVAL 24 DAY)),
(17, 19, 17, 5, DATE_SUB(CURDATE(), INTERVAL 42 DAY), DATE_SUB(CURDATE(), INTERVAL 28 DAY), DATE_SUB(CURDATE(), INTERVAL 28 DAY)),
(18, 20, 18, 1, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 26 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
(19, 21, 19, 3, DATE_SUB(CURDATE(), INTERVAL 39 DAY), DATE_SUB(CURDATE(), INTERVAL 25 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY)),
(20, 22, 20, 2, DATE_SUB(CURDATE(), INTERVAL 38 DAY), DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
(21, 23, 21, 4, DATE_SUB(CURDATE(), INTERVAL 36 DAY), DATE_SUB(CURDATE(), INTERVAL 22 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(22, 24, 22, 5, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY)),
(23, 25, 23, 1, DATE_SUB(CURDATE(), INTERVAL 34 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
(24, 6, 24, 2, DATE_SUB(CURDATE(), INTERVAL 32 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY)),
(25, 9, 25, 3, DATE_SUB(CURDATE(), INTERVAL 31 DAY), DATE_SUB(CURDATE(), INTERVAL 17 DAY), DATE_SUB(CURDATE(), INTERVAL 14 DAY)),
(26, 1, 26, 4, DATE_SUB(CURDATE(), INTERVAL 85 DAY), DATE_SUB(CURDATE(), INTERVAL 71 DAY), DATE_SUB(CURDATE(), INTERVAL 71 DAY)),
(27, 2, 27, 5, DATE_SUB(CURDATE(), INTERVAL 82 DAY), DATE_SUB(CURDATE(), INTERVAL 68 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY)),
(28, 5, 28, 1, DATE_SUB(CURDATE(), INTERVAL 78 DAY), DATE_SUB(CURDATE(), INTERVAL 64 DAY), DATE_SUB(CURDATE(), INTERVAL 68 DAY)),
(29, 8, 29, 3, DATE_SUB(CURDATE(), INTERVAL 76 DAY), DATE_SUB(CURDATE(), INTERVAL 62 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY)),
(30, 10, 30, 2, DATE_SUB(CURDATE(), INTERVAL 72 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY)),
(31, 3, 21, 4, DATE_SUB(CURDATE(), INTERVAL 67 DAY), DATE_SUB(CURDATE(), INTERVAL 53 DAY), DATE_SUB(CURDATE(), INTERVAL 46 DAY)),
(32, 4, 20, 5, DATE_SUB(CURDATE(), INTERVAL 64 DAY), DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 51 DAY)),
(33, 1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 14 DAY), NULL),
(34, 1, 2, 2, DATE_SUB(CURDATE(), INTERVAL 17 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 17 DAY), INTERVAL 14 DAY), NULL),
(35, 2, 3, 3, DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 14 DAY), NULL),
(36, 3, 4, 1, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 14 DAY), NULL),
(37, 3, 5, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 14 DAY), NULL),
(38, 4, 6, 3, DATE_SUB(CURDATE(), INTERVAL 25 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 25 DAY), INTERVAL 14 DAY), NULL),
(39, 5, 7, 4, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 30 DAY), INTERVAL 14 DAY), NULL),
(40, 6, 8, 5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 DAY), INTERVAL 14 DAY), NULL),
(41, 7, 9, 1, DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 DAY), INTERVAL 14 DAY), NULL),
(42, 8, 10, 2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 DAY), INTERVAL 14 DAY), NULL),
(43, 9, 11, 3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 4 DAY), INTERVAL 14 DAY), NULL),
(44, 10, 12, 4, DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 6 DAY), INTERVAL 14 DAY), NULL),
(45, 11, 13, 5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 14 DAY), NULL),
(46, 12, 14, 1, DATE_SUB(CURDATE(), INTERVAL 13 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 13 DAY), INTERVAL 14 DAY), NULL),
(47, 13, 15, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 DAY), INTERVAL 14 DAY), NULL),
(48, 14, 16, 3, DATE_SUB(CURDATE(), INTERVAL 22 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 22 DAY), INTERVAL 14 DAY), NULL),
(49, 15, 17, 4, DATE_SUB(CURDATE(), INTERVAL 18 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 18 DAY), INTERVAL 14 DAY), NULL),
(50, 16, 25, 5, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 14 DAY), NULL);

-- 6) FINE (one fine row for each late returned issue; mixture of paid and unpaid).
INSERT INTO fine (fine_id, issue_id, amount, paid_status, paid_date) VALUES
(1, 2, 10, 'paid', DATE_SUB(CURDATE(), INTERVAL 59 DAY)),
(2, 4, 12, 'paid', DATE_SUB(CURDATE(), INTERVAL 48 DAY)),
(3, 6, 4, 'unpaid', NULL),
(4, 7, 20, 'paid', DATE_SUB(CURDATE(), INTERVAL 37 DAY)),
(5, 9, 8, 'paid', DATE_SUB(CURDATE(), INTERVAL 38 DAY)),
(6, 10, 28, 'unpaid', NULL),
(7, 12, 14, 'paid', DATE_SUB(CURDATE(), INTERVAL 27 DAY)),
(8, 13, 2, 'paid', DATE_SUB(CURDATE(), INTERVAL 31 DAY)),
(9, 14, 32, 'unpaid', NULL),
(10, 16, 10, 'paid', DATE_SUB(CURDATE(), INTERVAL 22 DAY)),
(11, 18, 22, 'paid', DATE_SUB(CURDATE(), INTERVAL 13 DAY)),
(12, 19, 8, 'unpaid', NULL),
(13, 21, 4, 'paid', DATE_SUB(CURDATE(), INTERVAL 18 DAY)),
(14, 23, 24, 'paid', DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(15, 25, 6, 'unpaid', NULL),
(16, 27, 16, 'paid', DATE_SUB(CURDATE(), INTERVAL 58 DAY)),
(17, 29, 8, 'paid', DATE_SUB(CURDATE(), INTERVAL 56 DAY)),
(18, 31, 14, 'unpaid', NULL);

COMMIT;

-- Useful notes for practice:
-- 1. Books 26-30 have never been issued, so they work for a 'never issued' subquery.
-- 2. Books 1 and 3 currently have zero available copies.
-- 3. There are currently overdue issues, plus returned late loans with paid/unpaid fines.
-- 4. Fine amount = (days between return_date and due_date) * Rs 2 for each late returned loan.
-- 5. All current/overdue dates and member join dates are relative to CURDATE().
