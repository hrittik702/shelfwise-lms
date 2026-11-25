-- Staff Table
CREATE TABLE staff (
    staff_id int AUTO_INCREMENT PRIMARY KEY,
    name varchar(50),
    username varchar(20) UNIQUE,
    password varchar(100)
);
-- Category Table
CREATE TABLE category(
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name varchar(20) UNIQUE
);
-- Books table
CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(50) NOT NULL,
    publisher VARCHAR(50),
    pub_year YEAR NOT NULL,
    category_id INT NOT NULL,
    total_copies INT NOT NULL DEFAULT 0,
    available_copies INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES category(category_id),
    CONSTRAINT check_total_copies CHECK (total_copies >= 0),
    CONSTRAINT check_available_copies CHECK (
        available_copies >= 0
        AND available_copies <= total_copies
    )
);
-- Members Table
CREATE TABLE members(
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    phone CHAR(10) UNIQUE,
    member_type ENUM("student", "faculty") NOT NULL,
    join_date DATE,
    status ENUM("active", "suspended") NOT NULL
);
-- Issue Table
CREATE TABLE issue(
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    staff_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    CONSTRAINT fk_book_id FOREIGN KEY (book_id) REFERENCES books(book_id),
    CONSTRAINT fk_member_id FOREIGN KEY (member_id) REFERENCES members(member_id),
    CONSTRAINT fk_staff_id FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);
-- Fine Table
CREATE TABLE fine(
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    amount INT DEFAULT 0,
    paid_status ENUM ("paid", "unpaid") NOT NULL,
    paid_date date,
    CONSTRAINT fk_issue_id FOREIGN KEY (issue_id) REFERENCES issue(issue_id)
);
-- /////////////////////////
-- View Query
-- /////////////////////////
CREATE OR REPLACE VIEW book_details AS
SELECT b.book_id,
    b.isbn,
    b.title,
    b.author,
    b.publisher,
    b.pub_year,
    b.total_copies,
    b.available_copies,
    c.category_name
FROM books AS b
    JOIN category AS c ON b.category_id = c.category_id;
-- view for issue_details
CREATE OR REPLACE VIEW issue_details AS
SELECT b.title,
    b.isbn,
    m.name,
    m.member_type,
    m.phone,
    s.name as staff_name
FROM issue as i
    join books as b on i.book_id = b.book_id
    join members as m on i.member_id = m.member_id
    join staff as s on i.staff_id = s.staff_id;
-- view for member details
create or replace VIEW member_details as
SELECT m.member_id,
    m.name,
    m.member_type,
    m.status,
    m.email,
    COUNT(i.issue_id) AS active_loans
FROM members m
    LEFT JOIN issue i ON i.member_id = m.member_id
    AND i.return_date IS NULL
GROUP BY m.member_id,
    m.name,
    m.member_type
ORDER BY active_loans DESC;
-- view for issue details
CREATE OR REPLACE VIEW issue_details AS
SELECT i.issue_id,
    i.book_id,
    i.member_id,
    b.title AS book_title,
    m.name AS member_name,
    m.member_type,
    s.name AS staff_name,
    i.issue_date,
    i.due_date,
    i.return_date,
    DATEDIFF(CURDATE(), due_date) AS days_overdue
FROM issue i
    JOIN books b ON b.book_id = i.book_id
    JOIN members m ON m.member_id = i.member_id
    JOIN staff s ON s.staff_id = i.staff_id;
select count(i.book_id)
from issue i
where book_id = 4;
select *
from issue;
Create or REPLACE view fine_details as
select *
from fine f
    join issue i on f.issue_id = i.issue_id;