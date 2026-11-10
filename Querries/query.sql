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

SELECT * FROM sessions;