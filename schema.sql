-- Staff Table
CREATE TABLE staff (
    staff_id int AUTO_INCREMENT PRIMARY KEY,
    name varchar(50), 
    username varchar(20) UNIQUE, 
    password varchar(100)
);

-- Category Table
CREATE TABLE category(
    category_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    category_name varchar(20) UNIQUE
);

-- Books table 
CREATE TABLE books (
    book_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    title VARCHAR(50) NOT NULL,
    author VARCHAR(30) NOT NULL,
    publisher VARCHAR(30),
    pub_year YEAR NOT NULL,
    category_id INT NOT NULL,
    total_copies INT NOT NULL DEFAULT 0,
    available_copies INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_books_category
        FOREIGN KEY (category_id)
        REFERENCES category(category_id),
    CONSTRAINT check_total_copies
        CHECK (total_copies >= 0),
    CONSTRAINT check_available_copies
        CHECK (
            available_copies >= 0
            AND available_copies <= total_copies
        )
);

-- Members Table
CREATE TABLE members(
    member_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30),
    email VARCHAR(40) UNIQUE,
    phone CHAR(10) UNIQUE, 
    member_type ENUM("student","faculty") NOT NULL, 
    join_date DATE, 
    status ENUM("active","suspended") NOT NULL
);

-- Issue Table
CREATE TABLE issue(
    issue_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    staff_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    CONSTRAINT fk_book_id 
        FOREIGN KEY (book_id) 
        REFERENCES books(book_id),
    CONSTRAINT fk_member_id
        FOREIGN KEY (member_id) 
        REFERENCES members(member_id),
    CONSTRAINT fk_staff_id 
        FOREIGN KEY (staff_id) 
        REFERENCES staff(staff_id)
);

CREATE TABLE fine(
    fine_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    amount INT DEFAULT 0, 
    paid_status ENUM ("paid","unpaid") NOT NULL,
    paid_date date,
    CONSTRAINT fk_issue_id 
        FOREIGN KEY (issue_id) 
        REFERENCES issue(issue_id)
);