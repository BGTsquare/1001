-- Storage Setup for Astewai Digital Bookstore
-- This migration creates the necessary storage buckets and policies

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create bucket for book covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for book content (PDFs, EPUBs, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-content',
  'book-content',
  false, -- Private bucket for purchased content
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/epub+zip', 'text/plain', 'application/zip']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for blog post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Book covers policies (public read, admin write)
CREATE POLICY "Book covers are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-covers' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update book covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-covers' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete book covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-covers' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Book content policies (private, only accessible to owners and admins)
CREATE POLICY "Users can view their purchased book content" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'book-content' AND (
      -- Admins can access all content
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
      -- Users can access content they own
      EXISTS (
        SELECT 1 FROM user_library ul
        JOIN books b ON ul.book_id = b.id
        WHERE ul.user_id = auth.uid() 
        AND ul.status = 'owned'
        AND (name LIKE '%/' || b.id::text || '/%' OR name LIKE b.id::text || '.%')
      )
    )
  );

CREATE POLICY "Admins can upload book content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-content' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update book content" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-content' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete book content" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-content' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Blog images policies (public read, admin write)
CREATE POLICY "Blog images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update blog images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blog-images' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Avatar policies (users can manage their own avatars)
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    (name LIKE auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '.%')
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    (name LIKE auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '.%')
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    (name LIKE auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '.%')
  );

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );