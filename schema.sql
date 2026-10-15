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
);