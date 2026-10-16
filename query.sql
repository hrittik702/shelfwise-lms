CREATE OR REPLACE VIEW book_details AS 
SELECT isbn,title,author,publisher,pub_year,available_copies,category FROM books JOIN category ON books.category_id=category.category_id;

CREATE OR REPLACE VIEW issue_details AS 