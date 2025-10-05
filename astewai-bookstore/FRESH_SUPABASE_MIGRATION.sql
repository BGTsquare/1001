-- =============================================
-- ASTEWAI DIGITAL BOOKSTORE - FRESH SUPABASE MIGRATION
-- =============================================
-- Complete database migration for fresh Supabase project
-- This file creates all tables, relationships, indexes, RLS policies,
-- storage buckets, and functions needed for the application.
--
-- Execute this entire file in Supabase SQL Editor for a fresh setup.
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES TABLE
-- =============================================
-- User profiles extending Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reading_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- BOOKS TABLE
-- =============================================
-- Book catalog with metadata and content
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  content_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[],
  bundle_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Books RLS policies - publicly readable
CREATE POLICY "Books are publicly readable" ON books
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage books" ON books
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_is_free ON books(is_free);
CREATE INDEX IF NOT EXISTS idx_books_bundle_only ON books(bundle_only);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);

-- =============================================
-- BUNDLES TABLE
-- =============================================
-- Curated book collections
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bundles
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

-- Bundles RLS policies - publicly readable
CREATE POLICY "Bundles are publicly readable" ON bundles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundles" ON bundles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bundles_created_at ON bundles(created_at);

-- =============================================
-- BUNDLE_BOOKS TABLE
-- =============================================
-- Many-to-many relationship between bundles and books
CREATE TABLE IF NOT EXISTS bundle_books (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, book_id)
);

-- Enable RLS on bundle_books
ALTER TABLE bundle_books ENABLE ROW LEVEL SECURITY;

-- Bundle_books RLS policies - publicly readable
CREATE POLICY "Bundle books are publicly readable" ON bundle_books
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundle books" ON bundle_books
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bundle_books_bundle_id ON bundle_books(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_books_book_id ON bundle_books(book_id);

-- =============================================
-- USER_LIBRARY TABLE
-- =============================================
-- User's personal book collection with reading progress
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'owned' CHECK (status IN ('owned', 'pending', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_read_position TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on user_library
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

-- User_library RLS policies
CREATE POLICY "Users can view own library" ON user_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own library" ON user_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own library" ON user_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all libraries" ON user_library
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_book_id ON user_library(book_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status);

-- =============================================
-- BLOG_POSTS TABLE
-- =============================================
-- Blog content management
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog_posts RLS policies
CREATE POLICY "Published blog posts are publicly readable" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can view own posts" ON blog_posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all blog posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authors can manage own posts" ON blog_posts
  FOR ALL USING (auth.uid() = author_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- =============================================
-- PURCHASES TABLE
-- =============================================
-- Purchase tracking with Telegram integration
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending_initiation' CHECK (status IN ('pending_initiation', 'awaiting_payment', 'pending_verification', 'completed', 'rejected')),
  payment_provider_id TEXT,
  transaction_reference TEXT,
  telegram_chat_id BIGINT,
  telegram_user_id BIGINT,
  initiation_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Purchases RLS policies
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all purchases" ON purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_item_type ON purchases(item_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);

-- =============================================
-- REVIEWS TABLE
-- =============================================
-- Book reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews RLS policies - publicly readable
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =============================================
-- ADMIN_CONTACT_INFO TABLE
-- =============================================
-- Admin contact methods for customer support
CREATE TABLE IF NOT EXISTS admin_contact_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'whatsapp', 'email')),
  contact_value TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_contact_info
ALTER TABLE admin_contact_info ENABLE ROW LEVEL SECURITY;

-- Admin_contact_info RLS policies
CREATE POLICY "Active admin contacts are publicly readable" ON admin_contact_info
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage admin contacts" ON admin_contact_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_admin_id ON admin_contact_info(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_contact_type ON admin_contact_info(contact_type);
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_is_active ON admin_contact_info(is_active);

-- =============================================
-- PURCHASE_REQUESTS TABLE
-- =============================================
-- Manual payment approval system
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'completed')),
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('telegram', 'whatsapp', 'email')),
  user_message TEXT,
  admin_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on purchase_requests
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Purchase_requests RLS policies
CREATE POLICY "Users can view own purchase requests" ON purchase_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchase requests" ON purchase_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase requests" ON purchase_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all purchase requests" ON purchase_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_item_type ON purchase_requests(item_type);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at);

-- =============================================
-- PAYMENT_CONFIG TABLE
-- =============================================
-- Ethiopian banking and mobile money configuration
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  config_type TEXT NOT NULL CHECK (config_type IN ('bank_account', 'mobile_money')),
  provider_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_config
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Payment_config RLS policies
CREATE POLICY "Active payment configs are publicly readable" ON payment_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment configs" ON payment_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_config_config_type ON payment_config(config_type);
CREATE INDEX IF NOT EXISTS idx_payment_config_is_active ON payment_config(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_config_display_order ON payment_config(display_order);

-- =============================================
-- PUSH_SUBSCRIPTIONS TABLE
-- =============================================
-- PWA push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Push_subscriptions RLS policies
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- =============================================
-- USER_SESSIONS TABLE
-- =============================================
-- Session management for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User_sessions RLS policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);

-- =============================================
-- ADMIN_SETTINGS TABLE
-- =============================================
-- Admin configuration key-value store
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin_settings RLS policies
CREATE POLICY "Admins can manage admin settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- =============================================
-- STORAGE BUCKETS SETUP
-- =============================================
-- Create storage buckets for file uploads

-- Book covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Book content bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-content',
  'book-content',
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'application/epub+zip', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Bundle covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bundle-covers',
  'bundle-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Payment confirmations bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-confirmations',
  'payment-confirmations',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Book covers storage policies (public read, admin write)
CREATE POLICY "Book covers are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update book covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete book covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bundle covers storage policies (public read, admin write)
CREATE POLICY "Bundle covers are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'bundle-covers');

CREATE POLICY "Admins can upload bundle covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bundle-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update bundle covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'bundle-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete bundle covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bundle-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Book content storage policies (private, user access based on ownership)
CREATE POLICY "Users can access owned book content" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'book-content' AND
    (
      -- User owns the book
      EXISTS (
        SELECT 1 FROM user_library ul
        JOIN books b ON b.id = ul.book_id
        WHERE ul.user_id = auth.uid()
        AND ul.status = 'owned'
        AND storage.objects.name LIKE b.id::text || '%'
      )
      OR
      -- User is admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can upload book content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-content' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update book content" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-content' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete book content" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-content' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payment confirmations storage policies (private, admin only)
CREATE POLICY "Admins can manage payment confirmations" ON storage.objects
  FOR ALL USING (
    bucket_id = 'payment-confirmations' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_contact_info_updated_at BEFORE UPDATE ON admin_contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON purchase_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_config_updated_at BEFORE UPDATE ON payment_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RPC FUNCTIONS FOR APPLICATION LOGIC
-- =============================================

-- Function to get books with bundle information
CREATE OR REPLACE FUNCTION get_books_with_bundles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  cover_image_url TEXT,
  content_url TEXT,
  price DECIMAL,
  is_free BOOLEAN,
  category TEXT,
  tags TEXT[],
  bundle_only BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  bundle_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.author,
    b.description,
    b.cover_image_url,
    b.content_url,
    b.price,
    b.is_free,
    b.category,
    b.tags,
    b.bundle_only,
    b.created_at,
    b.updated_at,
    COALESCE(ARRAY_AGG(bb.bundle_id) FILTER (WHERE bb.bundle_id IS NOT NULL), ARRAY[]::UUID[]) as bundle_ids
  FROM books b
  LEFT JOIN bundle_books bb ON b.id = bb.book_id
  GROUP BY b.id, b.title, b.author, b.description, b.cover_image_url,
           b.content_url, b.price, b.is_free, b.category, b.tags,
           b.bundle_only, b.created_at, b.updated_at;
END;
$$;

-- Function to get bundles with their books
CREATE OR REPLACE FUNCTION get_bundles_with_books()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  book_count BIGINT,
  total_book_price DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bu.id,
    bu.title,
    bu.description,
    bu.price,
    bu.cover_image_url,
    bu.created_at,
    bu.updated_at,
    COUNT(bb.book_id) as book_count,
    COALESCE(SUM(b.price), 0) as total_book_price
  FROM bundles bu
  LEFT JOIN bundle_books bb ON bu.id = bb.bundle_id
  LEFT JOIN books b ON bb.book_id = b.id
  GROUP BY bu.id, bu.title, bu.description, bu.price, bu.cover_image_url,
           bu.created_at, bu.updated_at;
END;
$$;

-- Function to add book to user library after purchase
CREATE OR REPLACE FUNCTION add_book_to_library(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_library (user_id, book_id, status)
  VALUES (p_user_id, p_book_id, 'owned')
  ON CONFLICT (user_id, book_id)
  DO UPDATE SET status = 'owned', added_at = NOW();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to add bundle books to user library
CREATE OR REPLACE FUNCTION add_bundle_to_library(
  p_user_id UUID,
  p_bundle_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  book_record RECORD;
BEGIN
  -- Add all books in the bundle to user's library
  FOR book_record IN
    SELECT bb.book_id
    FROM bundle_books bb
    WHERE bb.bundle_id = p_bundle_id
  LOOP
    INSERT INTO user_library (user_id, book_id, status)
    VALUES (p_user_id, book_record.book_id, 'owned')
    ON CONFLICT (user_id, book_id)
    DO UPDATE SET status = 'owned', added_at = NOW();
  END LOOP;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to check if user owns a book
CREATE OR REPLACE FUNCTION user_owns_book(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_library
    WHERE user_id = p_user_id
    AND book_id = p_book_id
    AND status = 'owned'
  );
END;
$$;

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default payment configurations for Ethiopian market
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, is_active, display_order)
VALUES
  ('bank_account', 'Commercial Bank of Ethiopia', '1000123456789', 'Astewai Digital Bookstore', 'Transfer to CBE account and send screenshot via Telegram', true, 1),
  ('bank_account', 'Dashen Bank', '0012345678901', 'Astewai Digital Bookstore', 'Transfer to Dashen Bank account and send confirmation', true, 2),
  ('mobile_money', 'Telebirr', '0911123456', 'Astewai Bookstore', 'Send payment via Telebirr and share transaction ID', true, 3),
  ('mobile_money', 'M-Birr', '0911123456', 'Astewai Bookstore', 'Send payment via M-Birr and share reference number', true, 4)
ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (key, value)
VALUES
  ('site_name', 'Astewai Digital Bookstore'),
  ('site_description', 'Your premier destination for digital books in Ethiopia'),
  ('contact_email', 'support@astewai-bookstore.com'),
  ('telegram_support', '@astewai_support'),
  ('whatsapp_support', '+251911123456'),
  ('currency', 'ETB'),
  ('tax_rate', '0.15'),
  ('free_shipping_threshold', '500'),
  ('max_file_size_mb', '100'),
  ('supported_formats', 'PDF,EPUB,TXT'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- FINAL SETUP AND PERMISSIONS
-- =============================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for anonymous users (for public content)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON books TO anon;
GRANT SELECT ON bundles TO anon;
GRANT SELECT ON bundle_books TO anon;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON admin_contact_info TO anon;
GRANT SELECT ON payment_config TO anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_books_with_bundles() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_bundles_with_books() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_book_to_library(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bundle_to_library(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_book(UUID, UUID) TO authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these queries to verify the migration was successful

-- Check that all tables were created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check that all storage buckets were created
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- Check that RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Check that functions were created
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_books_with_bundles',
  'get_bundles_with_books',
  'add_book_to_library',
  'add_bundle_to_library',
  'user_owns_book',
  'handle_new_user',
  'update_updated_at_column'
)
ORDER BY routine_name;

-- Check that indexes were created
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- This migration creates a complete database schema for the Astewai Digital Bookstore
-- including all tables, relationships, indexes, RLS policies, storage buckets,
-- utility functions, and seed data.
--
-- VERIFICATION CHECKLIST:
-- □ All 14 tables created successfully
-- □ All 4 storage buckets created (book-covers, book-content, bundle-covers, payment-confirmations)
-- □ All RLS policies enabled and configured
-- □ All 7 utility functions created
-- □ All indexes created for performance optimization
-- □ Seed data inserted (payment configs and admin settings)
-- □ Proper permissions granted to authenticated and anonymous users
--
-- NEXT STEPS:
-- 1. Update your environment variables with the new Supabase project credentials
-- 2. Configure authentication settings in Supabase Dashboard
-- 3. Test the application functionality
-- 4. Create your first admin user using the make-admin script
-- 5. Upload some sample books and covers to test the system
--
-- The database is now ready for production use!
-- =============================================