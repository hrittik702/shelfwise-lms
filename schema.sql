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
CREATE TABLE books(
    book_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    isbn CHAR(13) UNIQUE, 
    title VARCHAR(50), 
    author VARCHAR(30), 
    publisher VARCHAR(30), 
    pub_year YEAR NOT NULL,
    FOREIGN KEY (category_id) REFERENCE category(category_id) NOT NULL,
    total_copies INT NOT NULL DEFAULT 0,
    available_copies INT NOT NULL DEFAULT 0,
    CONSTRAINT check_total_copies
        CHECK (total_copies >= 0),
    CONSTRAINT chk_available_copies
        CHECK (
            available_copies >= 0
            AND available_copies <= total_copies
        ) 
);