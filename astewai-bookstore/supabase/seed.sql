-- Insert sample books
INSERT INTO books (title, author, description, price, is_free, category, tags) VALUES
('The Art of Programming', 'Jane Developer', 'A comprehensive guide to software development best practices and methodologies.', 29.99, false, 'Technology', ARRAY['programming', 'software', 'development']),
('Free Introduction to Web Development', 'John Coder', 'Learn the basics of HTML, CSS, and JavaScript in this beginner-friendly guide.', 0.00, true, 'Technology', ARRAY['web', 'html', 'css', 'javascript']),
('Database Design Fundamentals', 'Sarah Data', 'Master the principles of database design and normalization.', 39.99, false, 'Technology', ARRAY['database', 'sql', 'design']),
('Open Source Philosophy', 'Mike Freedom', 'Understanding the principles and impact of open source software.', 0.00, true, 'Technology', ARRAY['open-source', 'philosophy', 'community']),
('Advanced React Patterns', 'Lisa Component', 'Deep dive into advanced React patterns and performance optimization.', 49.99, false, 'Technology', ARRAY['react', 'javascript', 'frontend']);

-- Insert sample bundles
INSERT INTO bundles (title, description, price) VALUES
('Web Development Starter Pack', 'Everything you need to start your web development journey.', 59.99),
('Advanced Programming Bundle', 'Take your programming skills to the next level.', 89.99);

-- Link books to bundles
INSERT INTO bundle_books (bundle_id, book_id) VALUES
((SELECT id FROM bundles WHERE title = 'Web Development Starter Pack'), (SELECT id FROM books WHERE title = 'Free Introduction to Web Development')),
((SELECT id FROM bundles WHERE title = 'Web Development Starter Pack'), (SELECT id FROM books WHERE title = 'Database Design Fundamentals')),
((SELECT id FROM bundles WHERE title = 'Advanced Programming Bundle'), (SELECT id FROM books WHERE title = 'The Art of Programming')),
((SELECT id FROM bundles WHERE title = 'Advanced Programming Bundle'), (SELECT id FROM books WHERE title = 'Advanced React Patterns'));

-- Insert sample blog posts
INSERT INTO blog_posts (title, content, excerpt, category, tags, published) VALUES
('Welcome to Astewai Bookstore', 
'Welcome to our digital bookstore! We are excited to share our collection of programming and technology books with you. Our mission is to provide high-quality educational content that helps developers grow their skills and advance their careers.

In this blog, you will find:
- Book recommendations
- Programming tutorials
- Industry insights
- Author interviews

Stay tuned for more exciting content!', 
'Welcome to our digital bookstore! Discover our mission and what you can expect from our blog.',
'Announcements',
ARRAY['welcome', 'announcement', 'bookstore'],
true),

('Top 5 Programming Books for Beginners', 
'Starting your programming journey can be overwhelming with so many resources available. Here are our top 5 book recommendations for beginners:

1. **Free Introduction to Web Development** - Perfect for those new to web technologies
2. **The Art of Programming** - Covers fundamental programming concepts
3. **Database Design Fundamentals** - Essential for understanding data storage
4. **Open Source Philosophy** - Learn about the community aspect of programming
5. **Advanced React Patterns** - For those ready to dive deeper into frontend development

Each of these books provides a solid foundation and practical knowledge that will serve you throughout your programming career.',
'Discover the best programming books to start your coding journey.',
'Recommendations',
ARRAY['programming', 'beginners', 'books', 'recommendations'],
true),

('The Future of Digital Learning', 
'Digital learning has transformed how we acquire new skills and knowledge. In the programming world, this transformation is particularly evident...

[This would be a longer blog post about digital learning trends]',
'Exploring how digital platforms are changing the way we learn programming.',
'Education',
ARRAY['digital-learning', 'education', 'programming', 'future'],
false);

-- Note: Admin users and user libraries will be created through the application
-- The trigger will automatically create profiles when users sign up