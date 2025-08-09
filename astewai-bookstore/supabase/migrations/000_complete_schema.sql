-- Complete Database Schema for Astewai Digital Bookstore
-- This file consolidates and improves all previous migrations
-- Run this on a fresh Supabase project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- CORE TABLES
-- =============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reading_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create books table with enhanced fields
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  content_url TEXT,
  price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
  is_free BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_notes TEXT,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bundles table with search support
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bundle_books junction table
CREATE TABLE IF NOT EXISTS bundle_books (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, book_id)
);

-- Create user_library table
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'owned' CHECK (status IN ('owned', 'pending', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_read_position TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table (legacy - keeping for compatibility)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  payment_provider_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- =============================================
-- ADMIN CONTACT SYSTEM
-- =============================================

-- Create admin_contact_info table
CREATE TABLE IF NOT EXISTS admin_contact_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'whatsapp', 'email')),
  contact_value TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, contact_type, contact_value)
);

-- Create purchase_requests table (new system)
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'completed')),
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('telegram', 'whatsapp', 'email')),
  user_message TEXT,
  admin_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SEARCH AND ANALYTICS
-- =============================================

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_events table (optional)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Books indexes
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_is_free ON books(is_free);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON books USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_title_gin ON books USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author_gin ON books USING GIN(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_books_category_price ON books(category, price);
CREATE INDEX IF NOT EXISTS idx_books_is_free_category ON books(is_free, category);
CREATE INDEX IF NOT EXISTS idx_books_price_created_at ON books(price, created_at);

-- Bundles indexes
CREATE INDEX IF NOT EXISTS idx_bundles_search_vector ON bundles USING GIN(search_vector);

-- User library indexes
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Purchase related indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_item_type ON purchase_requests(item_type);

-- Admin contact indexes
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_admin_id ON admin_contact_info(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_contact_type ON admin_contact_info(contact_type);
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_is_active ON admin_contact_info(is_active);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS books_updated_at ON books;
CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS bundles_updated_at ON bundles;
CREATE TRIGGER bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS purchases_updated_at ON purchases;
CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS admin_contact_info_updated_at ON admin_contact_info;
CREATE TRIGGER admin_contact_info_updated_at
  BEFORE UPDATE ON admin_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to ensure only one primary contact per type per admin
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE admin_contact_info 
    SET is_primary = false 
    WHERE admin_id = NEW.admin_id 
      AND contact_type = NEW.contact_type 
      AND id != COALESCE(NEW.id, gen_random_uuid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single primary contact
DROP TRIGGER IF EXISTS ensure_single_primary_contact_trigger ON admin_contact_info;
CREATE TRIGGER ensure_single_primary_contact_trigger
  BEFORE INSERT OR UPDATE ON admin_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();--
 =============================================
-- SEARCH FUNCTIONS
-- =============================================

-- Function to update book search vector
CREATE OR REPLACE FUNCTION update_book_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update bundle search vector
CREATE OR REPLACE FUNCTION update_bundle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
DROP TRIGGER IF EXISTS books_search_vector_update ON books;
CREATE TRIGGER books_search_vector_update
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_book_search_vector();

DROP TRIGGER IF EXISTS bundles_search_vector_update ON bundles;
CREATE TRIGGER bundles_search_vector_update
  BEFORE INSERT OR UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_bundle_search_vector();

-- Advanced search function for books
CREATE OR REPLACE FUNCTION search_books(
  search_query text DEFAULT '',
  category_filter text DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  is_free_filter boolean DEFAULT NULL,
  status_filter text DEFAULT 'approved',
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  sort_by text DEFAULT 'relevance',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  description text,
  cover_image_url text,
  content_url text,
  price decimal,
  is_free boolean,
  category text,
  tags text[],
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  search_rank real
) AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Convert search query to tsquery if provided
  IF search_query IS NOT NULL AND search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

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
    b.status,
    b.created_at,
    b.updated_at,
    CASE 
      WHEN query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      ELSE 0.0
    END as search_rank
  FROM books b
  WHERE 
    -- Status filter (default to approved only)
    (status_filter IS NULL OR b.status = status_filter)
    -- Full-text search filter
    AND (query_tsquery IS NULL OR b.search_vector @@ query_tsquery)
    -- Category filter
    AND (category_filter IS NULL OR b.category = category_filter)
    -- Tags filter (any of the provided tags)
    AND (tags_filter IS NULL OR b.tags && tags_filter)
    -- Price range filter
    AND (price_min IS NULL OR b.price >= price_min)
    AND (price_max IS NULL OR b.price <= price_max)
    -- Free/paid filter
    AND (is_free_filter IS NULL OR b.is_free = is_free_filter)
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' AND query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      ELSE NULL
    END DESC NULLS LAST,
    CASE WHEN sort_by = 'title' AND sort_order = 'asc' THEN b.title END ASC,
    CASE WHEN sort_by = 'title' AND sort_order = 'desc' THEN b.title END DESC,
    CASE WHEN sort_by = 'author' AND sort_order = 'asc' THEN b.author END ASC,
    CASE WHEN sort_by = 'author' AND sort_order = 'desc' THEN b.author END DESC,
    CASE WHEN sort_by = 'price' AND sort_order = 'asc' THEN b.price END ASC,
    CASE WHEN sort_by = 'price' AND sort_order = 'desc' THEN b.price END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN b.created_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN b.created_at END DESC,
    b.created_at DESC -- Default fallback sort
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 10
)
RETURNS TABLE(suggestion text, frequency bigint) AS $$
BEGIN
  RETURN QUERY
  WITH word_frequencies AS (
    SELECT 
      word,
      COUNT(*) as freq
    FROM (
      SELECT unnest(string_to_array(lower(title), ' ')) as word FROM books WHERE status = 'approved'
      UNION ALL
      SELECT unnest(string_to_array(lower(author), ' ')) as word FROM books WHERE status = 'approved'
      UNION ALL
      SELECT unnest(tags) as word FROM books WHERE status = 'approved'
      UNION ALL
      SELECT lower(category) as word FROM books WHERE category IS NOT NULL AND status = 'approved'
    ) words
    WHERE 
      word LIKE lower(partial_query) || '%'
      AND length(word) > 2
      AND word NOT IN ('the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use')
    GROUP BY word
  )
  SELECT 
    word as suggestion,
    freq as frequency
  FROM word_frequencies
  ORDER BY freq DESC, word ASC
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Unified search function for books and bundles
CREATE OR REPLACE FUNCTION unified_search(
  search_query text DEFAULT '',
  include_books boolean DEFAULT true,
  include_bundles boolean DEFAULT true,
  category_filter text DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  is_free_filter boolean DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  description text,
  cover_image_url text,
  price decimal,
  is_free boolean,
  category text,
  tags text[],
  item_type text,
  search_rank real,
  created_at timestamptz
) AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Convert search query to tsquery if provided
  IF search_query IS NOT NULL AND search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  (
    -- Books search
    SELECT 
      b.id,
      b.title,
      b.author,
      b.description,
      b.cover_image_url,
      b.price,
      b.is_free,
      b.category,
      b.tags,
      'book'::text as item_type,
      CASE 
        WHEN query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
        ELSE 0.0
      END as search_rank,
      b.created_at
    FROM books b
    WHERE 
      include_books = true
      AND b.status = 'approved'
      AND (query_tsquery IS NULL OR b.search_vector @@ query_tsquery)
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (tags_filter IS NULL OR b.tags && tags_filter)
      AND (price_min IS NULL OR b.price >= price_min)
      AND (price_max IS NULL OR b.price <= price_max)
      AND (is_free_filter IS NULL OR b.is_free = is_free_filter)
  )
  UNION ALL
  (
    -- Bundles search
    SELECT 
      bu.id,
      bu.title,
      NULL::text as author,
      bu.description,
      NULL::text as cover_image_url,
      bu.price,
      false as is_free,
      NULL::text as category,
      NULL::text[] as tags,
      'bundle'::text as item_type,
      CASE 
        WHEN query_tsquery IS NOT NULL THEN ts_rank(bu.search_vector, query_tsquery)
        ELSE 0.0
      END as search_rank,
      bu.created_at
    FROM bundles bu
    WHERE 
      include_bundles = true
      AND (query_tsquery IS NULL OR bu.search_vector @@ query_tsquery)
      AND (price_min IS NULL OR bu.price >= price_min)
      AND (price_max IS NULL OR bu.price <= price_max)
      AND (is_free_filter IS NULL OR is_free_filter = false) -- bundles are never free
  )
  ORDER BY search_rank DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to track search queries
CREATE OR REPLACE FUNCTION track_search_query(
  query_text text,
  result_count integer DEFAULT 0,
  user_uuid uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (search_query, results_count, user_id)
  VALUES (query_text, result_count, user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  time_period interval DEFAULT '30 days',
  search_limit integer DEFAULT 10
)
RETURNS TABLE(search_query text, search_count bigint, avg_results decimal) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 2) as avg_results
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - time_period
    AND sa.search_query IS NOT NULL
    AND sa.search_query != ''
  GROUP BY sa.search_query
  HAVING COUNT(*) > 1  -- Only show searches that happened more than once
  ORDER BY search_count DESC, avg_results DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics events
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  -- Delete events older than 90 days
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete sessions older than 30 days
  DELETE FROM user_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old search analytics older than 180 days
  DELETE FROM search_analytics 
  WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are created automatically" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Profiles are created automatically" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Drop existing book policies
DROP POLICY IF EXISTS "Books are publicly readable" ON books;
DROP POLICY IF EXISTS "Admins can insert books" ON books;
DROP POLICY IF EXISTS "Admins can update books" ON books;
DROP POLICY IF EXISTS "Admins can delete books" ON books;
DROP POLICY IF EXISTS "Admins can manage book status" ON books;

-- Books policies (only approved books are publicly readable)
CREATE POLICY "Approved books are publicly readable" ON books
  FOR SELECT USING (status = 'approved' OR is_admin());

CREATE POLICY "Admins can insert books" ON books
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update books" ON books
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete books" ON books
  FOR DELETE USING (is_admin());

-- Drop existing bundle policies
DROP POLICY IF EXISTS "Bundles are publicly readable" ON bundles;
DROP POLICY IF EXISTS "Admins can insert bundles" ON bundles;
DROP POLICY IF EXISTS "Admins can update bundles" ON bundles;
DROP POLICY IF EXISTS "Admins can delete bundles" ON bundles;

-- Bundles policies (publicly readable, admin manageable)
CREATE POLICY "Bundles are publicly readable" ON bundles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert bundles" ON bundles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update bundles" ON bundles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete bundles" ON bundles
  FOR DELETE USING (is_admin());

-- Drop existing bundle_books policies
DROP POLICY IF EXISTS "Bundle books are publicly readable" ON bundle_books;
DROP POLICY IF EXISTS "Admins can manage bundle books" ON bundle_books;

-- Bundle_books policies
CREATE POLICY "Bundle books are publicly readable" ON bundle_books
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundle books" ON bundle_books
  FOR ALL USING (is_admin());

-- Drop existing user_library policies
DROP POLICY IF EXISTS "Users can view their own library" ON user_library;
DROP POLICY IF EXISTS "Users can insert to their own library" ON user_library;
DROP POLICY IF EXISTS "Users can update their own library" ON user_library;
DROP POLICY IF EXISTS "Users can delete from their own library" ON user_library;
DROP POLICY IF EXISTS "Admins can view all libraries" ON user_library;
DROP POLICY IF EXISTS "Admins can manage all libraries" ON user_library;

-- User_library policies
CREATE POLICY "Users can view their own library" ON user_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own library" ON user_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library" ON user_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own library" ON user_library
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all libraries" ON user_library
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all libraries" ON user_library
  FOR ALL USING (is_admin());

-- Drop existing blog_posts policies
DROP POLICY IF EXISTS "Published blog posts are publicly readable" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;

-- Blog_posts policies
CREATE POLICY "Published blog posts are publicly readable" ON blog_posts
  FOR SELECT USING (published = true OR is_admin());

CREATE POLICY "Admins can insert blog posts" ON blog_posts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update blog posts" ON blog_posts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete blog posts" ON blog_posts
  FOR DELETE USING (is_admin());

-- Drop existing purchase policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;

-- Purchases policies (legacy)
CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON purchases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all purchases" ON purchases
  FOR ALL USING (is_admin());

-- Purchase_requests policies (new system)
CREATE POLICY "Users can view their own purchase requests" ON purchase_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase requests" ON purchase_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase requests" ON purchase_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchase requests" ON purchase_requests
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all purchase requests" ON purchase_requests
  FOR ALL USING (is_admin());

-- Drop existing review policies
DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

-- Reviews policies
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (is_admin());

-- Admin contact info policies
CREATE POLICY "Admins can manage their own contact info" ON admin_contact_info
  FOR ALL USING (auth.uid() = admin_id AND is_admin());

CREATE POLICY "Users can view active admin contact info" ON admin_contact_info
  FOR SELECT USING (is_active = true);

-- Search analytics policies
CREATE POLICY "System can insert search analytics" ON search_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view search analytics" ON search_analytics
  FOR SELECT USING (is_admin());

-- Analytics events policies
CREATE POLICY "System can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read analytics events" ON analytics_events
  FOR SELECT USING (is_admin());

-- User sessions policies
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all sessions" ON user_sessions
  FOR SELECT USING (is_admin());

CREATE POLICY "System can manage sessions" ON user_sessions
  FOR ALL WITH CHECK (true);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION search_books TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_search_query TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_popular_searches TO authenticated, anon;
GRANT EXECUTE ON FUNCTION unified_search TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_old_analytics_events TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON search_analytics TO authenticated;
GRANT SELECT ON search_analytics TO anon;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT SELECT ON analytics_events TO anon;

-- Update existing records to have search vectors
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

-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

-- Note: Storage bucket creation should be done through Supabase dashboard or CLI
-- This is included here for reference but may need to be run separately

-- Create storage bucket for books (run this manually if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'books',
--   'books',
--   true,
--   52428800, -- 50MB limit
--   ARRAY[
--     'image/jpeg',
--     'image/png',
--     'image/webp',
--     'image/gif',
--     'application/pdf',
--     'application/epub+zip',
--     'text/plain',
--     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
--   ]
-- ) ON CONFLICT (id) DO NOTHING;

-- Storage policies for books bucket (run after bucket creation)
-- CREATE POLICY "Public can view book files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'books');

-- CREATE POLICY "Admins can upload book files" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'books' AND
--     is_admin()
--   );

-- CREATE POLICY "Admins can update book files" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'books' AND
--     is_admin()
--   );

-- CREATE POLICY "Admins can delete book files" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'books' AND
--     is_admin()
--   );