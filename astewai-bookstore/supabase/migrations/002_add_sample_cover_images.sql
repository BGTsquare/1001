-- Add sample cover images to existing books and bundles
-- This migration adds placeholder cover images so the UI displays properly

-- Update books with sample cover images
UPDATE books SET cover_image_url = CASE 
  WHEN title = 'The Art of Programming' THEN 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Free Introduction to Web Development' THEN 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Database Design Fundamentals' THEN 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Open Source Philosophy' THEN 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Advanced React Patterns' THEN 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Python for Data Science' THEN 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Introduction to Machine Learning' THEN 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'DevOps Best Practices' THEN 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Cybersecurity Essentials' THEN 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop&crop=center'
  WHEN title = 'Mobile App Development' THEN 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=600&fit=crop&crop=center'
  ELSE cover_image_url
END
WHERE cover_image_url IS NULL;

-- Update bundles with sample cover images
UPDATE bundles SET cover_image_url = CASE 
  WHEN title = 'Web Development Starter Pack' THEN 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=400&fit=crop&crop=center'
  WHEN title = 'Advanced Programming Bundle' THEN 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop&crop=center'
  WHEN title = 'Data Science Complete Course' THEN 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=400&fit=crop&crop=center'
  WHEN title = 'Full Stack Developer Bundle' THEN 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop&crop=center'
  WHEN title = 'DevOps and Security Bundle' THEN 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=600&h=400&fit=crop&crop=center'
  ELSE cover_image_url
END
WHERE cover_image_url IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN books.cover_image_url IS 'URL to the book cover image - updated with sample images for demo purposes';
COMMENT ON COLUMN bundles.cover_image_url IS 'URL to the bundle cover image - updated with sample images for demo purposes';