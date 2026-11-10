INSERT INTO books (
        book_id,
        isbn,
        title,
        author,
        publisher,
        pub_year,
        category_id,
        total_copies,
        available_copies
    )
VALUES (
        1,
        '9781000000001',
        'Engineering Mathematics',
        'B. S. Grewal',
        'Khanna Publishers',
        2020,
        1,
        5,
        5
    ),
    (
        2,
        '9781000000002',
        'Higher Engineering Mathematics',
        'B. S. Grewal',
        'Khanna Publishers',
        2017,
        1,
        4,
        4
    ),
    (
        3,
        '9781000000003',
        'Discrete Mathematics and Applications',
        'Kenneth Rosen',
        'McGraw Hill India',
        2019,
        1,
        4,
        4
    ),
    (
        4,
        '9781000000004',
        'Advanced Engineering Mathematics',
        'Erwin Kreyszig',
        'Wiley India',
        2011,
        1,
        3,
        3
    ),
    (
        5,
        '9781000000005',
        'Engineering Physics',
        'H. K. Malik',
        'McGraw Hill India',
        2012,
        1,
        4,
        4
    ),
    (
        6,
        '9781000000006',
        'Engineering Chemistry',
        'Shashi Chawla',
        'Dhanpat Rai',
        2017,
        1,
        3,
        3
    ),
    (
        7,
        '9781000000007',
        'Engineering Mechanics',
        'S. S. Bhavikatti',
        'New Age Intl',
        2018,
        1,
        4,
        4
    );
INSERT INTO category
VALUES(1, "Test-Books");
