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
CREATE OR REPLACE VIEW member_details AS
SELECT m.* (
        SELECT COUNT(*)
        FROM issue i
        WHERE i.member_id = m.member_id
            AND i.return_date IS NULL
    ) AS active_loans,
    (
        SELECT COUNT(*)
        FROM issue I
        WHERE issue i
        WHERE i.member_id = m.member_id
    ) AS total_issues,
    (
        SELECT COALESCE(SUM(f.amount), 0) FROM fine f JOIN issue i on f.issue_id = 
    )