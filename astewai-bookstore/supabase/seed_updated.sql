-- Updated Seed Data for Astewai Digital Bookstore
-- This file contains sample data to populate the database

-- Insert sample books (only if they don't exist)
INSERT INTO books (title, author, description, price, is_free, category, tags, status) 
SELECT * FROM (VALUES
  ('The Art of Programming', 'Jane Developer', 'A comprehensive guide to software development best practices and methodologies. Learn how to write clean, maintainable code and follow industry standards.', 29.99, false, 'Technology', ARRAY['programming', 'software', 'development', 'best-practices'], 'approved'),
  ('Free Introduction to Web Development', 'John Coder', 'Learn the basics of HTML, CSS, and JavaScript in this beginner-friendly guide. Perfect for those starting their web development journey.', 0.00, true, 'Technology', ARRAY['web', 'html', 'css', 'javascript', 'beginner'], 'approved'),
  ('Database Design Fundamentals', 'Sarah Data', 'Master the principles of database design and normalization. Understand how to create efficient and scalable database schemas.', 39.99, false, 'Technology', ARRAY['database', 'sql', 'design', 'normalization'], 'approved'),
  ('Open Source Philosophy', 'Mike Freedom', 'Understanding the principles and impact of open source software. Explore the community-driven development model and its benefits.', 0.00, true, 'Technology', ARRAY['open-source', 'philosophy', 'community', 'collaboration'], 'approved'),
  ('Advanced React Patterns', 'Lisa Component', 'Deep dive into advanced React patterns and performance optimization. Learn hooks, context, and modern React development techniques.', 49.99, false, 'Technology', ARRAY['react', 'javascript', 'frontend', 'hooks', 'performance'], 'approved'),
  ('Python for Data Science', 'Dr. Analytics', 'Comprehensive guide to using Python for data analysis, visualization, and machine learning. Includes practical examples and projects.', 44.99, false, 'Data Science', ARRAY['python', 'data-science', 'machine-learning', 'pandas', 'numpy'], 'approved'),
  ('Introduction to Machine Learning', 'AI Expert', 'Learn the fundamentals of machine learning algorithms and their applications. No prior experience required.', 0.00, true, 'Data Science', ARRAY['machine-learning', 'ai', 'algorithms', 'beginner'], 'approved'),
  ('DevOps Best Practices', 'Cloud Engineer', 'Master modern DevOps practices including CI/CD, containerization, and cloud deployment strategies.', 54.99, false, 'DevOps', ARRAY['devops', 'ci-cd', 'docker', 'kubernetes', 'cloud'], 'approved'),
  ('Cybersecurity Essentials', 'Security Pro', 'Essential cybersecurity concepts every developer should know. Learn about common vulnerabilities and how to prevent them.', 34.99, false, 'Security', ARRAY['cybersecurity', 'security', 'vulnerabilities', 'encryption'], 'approved'),
  ('Mobile App Development', 'Mobile Dev', 'Build cross-platform mobile applications using modern frameworks and tools. Covers both iOS and Android development.', 42.99, false, 'Mobile', ARRAY['mobile', 'ios', 'android', 'react-native', 'flutter'], 'approved')
) AS v(title, author, description, price, is_free, category, tags, status)
WHERE NOT EXISTS (SELECT 1 FROM books WHERE books.title = v.title);

-- Insert sample bundles (only if they don't exist)
INSERT INTO bundles (title, description, price) 
SELECT * FROM (VALUES
  ('Web Development Starter Pack', 'Everything you need to start your web development journey. Includes HTML, CSS, JavaScript fundamentals and database design.', 59.99),
  ('Advanced Programming Bundle', 'Take your programming skills to the next level with advanced patterns and best practices.', 89.99),
  ('Data Science Complete Course', 'Comprehensive data science learning path from Python basics to machine learning applications.', 79.99),
  ('Full Stack Developer Bundle', 'Complete full-stack development package covering frontend, backend, and database technologies.', 129.99),
  ('DevOps and Security Bundle', 'Essential DevOps practices combined with cybersecurity fundamentals for modern development.', 99.99)
) AS v(title, description, price)
WHERE NOT EXISTS (SELECT 1 FROM bundles WHERE bundles.title = v.title);

-- Link books to bundles (using ON CONFLICT to handle duplicates)

-- Web Development Starter Pack
INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Web Development Starter Pack'),
  (SELECT id FROM books WHERE title = 'Free Introduction to Web Development')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Web Development Starter Pack')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Free Introduction to Web Development')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Web Development Starter Pack'),
  (SELECT id FROM books WHERE title = 'Database Design Fundamentals')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Web Development Starter Pack')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Database Design Fundamentals')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

-- Advanced Programming Bundle
INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Advanced Programming Bundle'),
  (SELECT id FROM books WHERE title = 'The Art of Programming')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Advanced Programming Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'The Art of Programming')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Advanced Programming Bundle'),
  (SELECT id FROM books WHERE title = 'Advanced React Patterns')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Advanced Programming Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Advanced React Patterns')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

-- Data Science Complete Course
INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Data Science Complete Course'),
  (SELECT id FROM books WHERE title = 'Python for Data Science')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Data Science Complete Course')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Python for Data Science')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Data Science Complete Course'),
  (SELECT id FROM books WHERE title = 'Introduction to Machine Learning')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Data Science Complete Course')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Introduction to Machine Learning')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

-- Full Stack Developer Bundle
INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Full Stack Developer Bundle'),
  (SELECT id FROM books WHERE title = 'Free Introduction to Web Development')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Full Stack Developer Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Free Introduction to Web Development')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Full Stack Developer Bundle'),
  (SELECT id FROM books WHERE title = 'Advanced React Patterns')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Full Stack Developer Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Advanced React Patterns')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'Full Stack Developer Bundle'),
  (SELECT id FROM books WHERE title = 'Database Design Fundamentals')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'Full Stack Developer Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Database Design Fundamentals')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

-- DevOps and Security Bundle
INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'DevOps and Security Bundle'),
  (SELECT id FROM books WHERE title = 'DevOps Best Practices')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'DevOps and Security Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'DevOps Best Practices')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

INSERT INTO bundle_books (bundle_id, book_id) 
SELECT 
  (SELECT id FROM bundles WHERE title = 'DevOps and Security Bundle'),
  (SELECT id FROM books WHERE title = 'Cybersecurity Essentials')
WHERE EXISTS (SELECT 1 FROM bundles WHERE title = 'DevOps and Security Bundle')
  AND EXISTS (SELECT 1 FROM books WHERE title = 'Cybersecurity Essentials')
ON CONFLICT (bundle_id, book_id) DO NOTHING;

-- Insert sample blog posts (only if they don't exist)
INSERT INTO blog_posts (title, content, excerpt, category, tags, published) 
SELECT * FROM (VALUES
  ('Welcome to Astewai Bookstore', 
   'Welcome to our digital bookstore! We are excited to share our collection of programming and technology books with you. Our mission is to provide high-quality educational content that helps developers grow their skills and advance their careers.

In this blog, you will find:
- Book recommendations and reviews
- Programming tutorials and guides
- Industry insights and trends
- Author interviews and spotlights
- Learning path recommendations

Our curated collection focuses on practical, hands-on learning materials that you can apply immediately in your projects. Whether you''re a beginner just starting your coding journey or an experienced developer looking to expand your skills, we have something for everyone.

We believe in the power of continuous learning and the importance of staying updated with the latest technologies and best practices. Our team carefully selects each book to ensure it meets our high standards for quality and relevance.

Stay tuned for more exciting content, and don''t forget to check out our book bundles for great savings on related topics!', 
   'Welcome to our digital bookstore! Discover our mission and what you can expect from our blog.',
   'Announcements',
   ARRAY['welcome', 'announcement', 'bookstore', 'mission'],
   true),

  ('Top 10 Programming Books for Beginners in 2025', 
   'Starting your programming journey can be overwhelming with so many resources available. Here are our top 10 book recommendations for beginners in 2025:

## 1. Free Introduction to Web Development
Perfect for those new to web technologies. This book covers HTML, CSS, and JavaScript fundamentals with practical examples.

## 2. The Art of Programming
Covers fundamental programming concepts that apply across all languages. Essential for building a strong foundation.

## 3. Database Design Fundamentals
Understanding data storage is crucial for any developer. This book teaches you how to design efficient database schemas.

## 4. Open Source Philosophy
Learn about the community aspect of programming and how open source drives innovation.

## 5. Python for Data Science
If you''re interested in data analysis, this comprehensive guide will get you started with Python.

## 6. Introduction to Machine Learning
AI and ML are everywhere. This beginner-friendly book introduces core concepts without overwhelming technical jargon.

## 7. Mobile App Development
Learn to build cross-platform mobile applications using modern frameworks.

## 8. Cybersecurity Essentials
Security should be a priority from day one. Learn about common vulnerabilities and how to prevent them.

## 9. DevOps Best Practices
Modern development requires understanding deployment and operations. This book covers essential DevOps concepts.

## 10. Advanced React Patterns
For those ready to dive deeper into frontend development with one of the most popular frameworks.

Each of these books provides practical knowledge that you can apply immediately. Consider our bundles for great savings when purchasing multiple related books!',
   'Discover the best programming books to start your coding journey in 2025.',
   'Recommendations',
   ARRAY['programming', 'beginners', 'books', 'recommendations', '2025'],
   true),

  ('The Future of Digital Learning in Tech Education', 
   'Digital learning has transformed how we acquire new skills and knowledge. In the programming world, this transformation is particularly evident as traditional classroom-based education gives way to more flexible, accessible, and practical learning approaches.

## The Rise of Interactive Learning

Modern digital books and courses now include interactive elements that were impossible in traditional textbooks. Code examples can be executed directly, exercises provide immediate feedback, and complex concepts are explained through multimedia content.

## Personalized Learning Paths

AI-driven platforms can now create personalized learning experiences based on individual progress, learning style, and career goals. This means learners can focus on areas where they need the most improvement while accelerating through familiar concepts.

## Community-Driven Learning

The open-source philosophy has extended to education, with communities contributing to shared knowledge bases, providing peer support, and collaborating on learning materials.

## Practical, Project-Based Approach

The most effective digital learning resources now emphasize hands-on projects and real-world applications rather than theoretical concepts alone. This approach helps learners build portfolios while they learn.

## Microlearning and Just-in-Time Education

Busy professionals can now learn in small chunks, accessing specific information exactly when they need it. This approach is particularly effective for learning new technologies and frameworks.

## The Role of Curated Content

With the overwhelming amount of information available, curated collections like our book bundles help learners navigate the landscape and follow structured learning paths.

The future of tech education is bright, with digital platforms making high-quality education more accessible than ever before.',
   'Exploring how digital platforms are changing the way we learn programming and technology.',
   'Education',
   ARRAY['digital-learning', 'education', 'programming', 'future', 'technology'],
   true),

  ('Building Your First Full-Stack Application: A Roadmap', 
   'Creating your first full-stack application is an exciting milestone in any developer''s journey. This comprehensive roadmap will guide you through the process, from planning to deployment.

## Phase 1: Planning and Design (Week 1)
- Define your application''s purpose and target audience
- Create user stories and wireframes
- Choose your technology stack
- Set up your development environment

## Phase 2: Backend Development (Weeks 2-4)
- Design your database schema
- Set up your server and API endpoints
- Implement authentication and authorization
- Add data validation and error handling

## Phase 3: Frontend Development (Weeks 5-7)
- Create your user interface components
- Implement state management
- Connect to your backend API
- Add responsive design and accessibility features

## Phase 4: Integration and Testing (Week 8)
- Integrate frontend and backend
- Write unit and integration tests
- Perform user acceptance testing
- Fix bugs and optimize performance

## Phase 5: Deployment and Monitoring (Week 9)
- Choose a hosting platform
- Set up CI/CD pipelines
- Deploy your application
- Implement monitoring and logging

## Recommended Resources
Our Full Stack Developer Bundle includes all the books you need for this journey, covering web development fundamentals, database design, and advanced patterns.

Remember, building your first full-stack application is a learning process. Don''t be afraid to make mistakes – they''re valuable learning opportunities!',
   'A comprehensive roadmap for building your first full-stack application from planning to deployment.',
   'Tutorials',
   ARRAY['full-stack', 'tutorial', 'roadmap', 'web-development', 'beginner'],
   false),

  ('Why Every Developer Should Learn About Cybersecurity', 
   'In today''s interconnected world, cybersecurity is not just the responsibility of security specialists – it''s a crucial skill for every developer. Here''s why you should prioritize security in your development journey.

## Security is Everyone''s Responsibility

Modern applications handle sensitive user data, financial information, and personal details. A single vulnerability can lead to data breaches, financial losses, and damaged reputation.

## Common Security Vulnerabilities

Understanding common vulnerabilities like SQL injection, cross-site scripting (XSS), and authentication flaws helps you write more secure code from the start.

## The Cost of Security Breaches

Security incidents can be extremely costly, both financially and in terms of user trust. Prevention is always more cost-effective than remediation.

## Security by Design

Incorporating security considerations from the beginning of the development process is more effective than trying to add security as an afterthought.

## Career Advantages

Developers with security knowledge are in high demand and often command higher salaries. Security skills make you a more valuable team member.

## Building User Trust

Users are increasingly aware of privacy and security concerns. Demonstrating that you take security seriously builds trust and credibility.

## Recommended Learning Path

Start with our Cybersecurity Essentials book to understand fundamental concepts, then explore our DevOps and Security Bundle for a comprehensive approach to secure development practices.

Remember, security is an ongoing process, not a one-time implementation. Stay updated with the latest threats and best practices.',
   'Understanding why cybersecurity knowledge is essential for modern developers.',
   'Security',
   ARRAY['cybersecurity', 'security', 'development', 'best-practices', 'career'],
   true)
) AS v(title, content, excerpt, category, tags, published)
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.title = v.title);

-- Note: Admin users and user libraries will be created through the application
-- The trigger will automatically create profiles when users sign up

-- Insert some sample search analytics (for demonstration)
INSERT INTO search_analytics (search_query, results_count, user_id) 
SELECT * FROM (VALUES
  ('javascript', 3, NULL::UUID),
  ('python', 2, NULL::UUID),
  ('react', 2, NULL::UUID),
  ('database', 1, NULL::UUID),
  ('security', 1, NULL::UUID),
  ('machine learning', 1, NULL::UUID),
  ('web development', 4, NULL::UUID),
  ('programming', 5, NULL::UUID)
) AS v(search_query, results_count, user_id)
WHERE NOT EXISTS (SELECT 1 FROM search_analytics WHERE search_analytics.search_query = v.search_query);

-- Update search vectors for all inserted data
UPDATE books SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(author, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'D')
WHERE search_vector IS NULL;

UPDATE bundles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;