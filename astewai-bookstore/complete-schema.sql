-- =============================================
-- ASTEWAI DIGITAL BOOKSTORE - COMPLETE SCHEMA
-- =============================================
-- This is a complete, clean database schema for production use
-- Run this on your Supabase project SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- CORE TABLES
-- =============================================

-- Profiles table (user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT, -- Added from your existing schema
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reading_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Books table
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

-- Bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cover_image_url TEXT, -- Added from your existing schema
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundle-Books relationship
CREATE TABLE IF NOT EXISTS bundle_books (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, book_id)
);

-- User Library
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

-- Blog Posts
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

-- Reviews
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
-- PURCHASE & PAYMENT SYSTEM
-- =============================================

-- Purchase Requests (New Contact System)
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

-- Legacy Purchases table (for compatibility with existing code)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  item_title TEXT, -- Added from your schema
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending_initiation', 'awaiting_payment', 'pending_verification', 'completed', 'rejected')),
  payment_provider_id TEXT,
  transaction_reference TEXT UNIQUE, -- Added from your schema
  telegram_chat_id BIGINT, -- Added from your schema
  telegram_user_id BIGINT, -- Added from your schema
  amount_in_birr INTEGER, -- Added from your schema
  initiation_token TEXT UNIQUE, -- Added from your schema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Contact Information
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

-- Payment Configuration
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('bank_account', 'mobile_money')),
  provider_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TELEGRAM & ADMIN SYSTEM
-- =============================================

-- Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Screenshots (for Telegram bot)
CREATE TABLE IF NOT EXISTS purchase_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  telegram_file_id TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Tokens (for secure access)
CREATE TABLE IF NOT EXISTS reading_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS & FEATURES
-- =============================================

-- Search Analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Subscriptions (for web notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Book indexes
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_is_free ON books(is_free);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON books USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_title_gin ON books USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author_gin ON books USING GIN(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_books_price_created_at ON books(price, created_at);

-- Bundle indexes
CREATE INDEX IF NOT EXISTS idx_bundles_search_vector ON bundles USING GIN(search_vector);

-- User library indexes
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Purchase indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_ref ON purchases(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);

-- Admin and analytics indexes
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_admin_id ON admin_contact_info(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_contact_info_is_active ON admin_contact_info(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_config_is_active ON payment_config(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_purchase_screenshots_purchase_id ON purchase_screenshots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_token ON reading_tokens(token);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Updated timestamp function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(profiles.email, NEW.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search vector update functions
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

CREATE OR REPLACE FUNCTION update_bundle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure single primary contact function
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

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Updated at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS books_updated_at ON books;
CREATE TRIGGER books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS bundles_updated_at ON bundles;
CREATE TRIGGER bundles_updated_at BEFORE UPDATE ON bundles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS purchases_updated_at ON purchases;
CREATE TRIGGER purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER purchase_requests_updated_at BEFORE UPDATE ON purchase_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS admin_contact_info_updated_at ON admin_contact_info;
CREATE TRIGGER admin_contact_info_updated_at BEFORE UPDATE ON admin_contact_info FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS payment_config_updated_at ON payment_config;
CREATE TRIGGER payment_config_updated_at BEFORE UPDATE ON payment_config FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS admin_settings_updated_at ON admin_settings;
CREATE TRIGGER admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- New user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Search vector triggers
DROP TRIGGER IF EXISTS books_search_vector_update ON books;
CREATE TRIGGER books_search_vector_update BEFORE INSERT OR UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_book_search_vector();

DROP TRIGGER IF EXISTS bundles_search_vector_update ON bundles;
CREATE TRIGGER bundles_search_vector_update BEFORE INSERT OR UPDATE ON bundles FOR EACH ROW EXECUTE FUNCTION update_bundle_search_vector();

-- Primary contact trigger
DROP TRIGGER IF EXISTS ensure_single_primary_contact_trigger ON admin_contact_info;
CREATE TRIGGER ensure_single_primary_contact_trigger BEFORE INSERT OR UPDATE ON admin_contact_info FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_contact();

-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- Books policies
DROP POLICY IF EXISTS "Anyone can view approved books" ON books;
CREATE POLICY "Anyone can view approved books" ON books FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can manage all books" ON books;
CREATE POLICY "Admins can manage all books" ON books FOR ALL USING (is_admin());

-- Bundles policies
DROP POLICY IF EXISTS "Anyone can view bundles" ON bundles;
CREATE POLICY "Anyone can view bundles" ON bundles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage bundles" ON bundles;
CREATE POLICY "Admins can manage bundles" ON bundles FOR ALL USING (is_admin());

-- Bundle books policies
DROP POLICY IF EXISTS "Anyone can view bundle books" ON bundle_books;
CREATE POLICY "Anyone can view bundle books" ON bundle_books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage bundle books" ON bundle_books;
CREATE POLICY "Admins can manage bundle books" ON bundle_books FOR ALL USING (is_admin());

-- User library policies
DROP POLICY IF EXISTS "Users can manage their own library" ON user_library;
CREATE POLICY "Users can manage their own library" ON user_library FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all libraries" ON user_library;
CREATE POLICY "Admins can view all libraries" ON user_library FOR SELECT USING (is_admin());

-- Blog posts policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
CREATE POLICY "Anyone can view published blog posts" ON blog_posts FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON blog_posts;
CREATE POLICY "Admins can manage all blog posts" ON blog_posts FOR ALL USING (is_admin());

-- Reviews policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own reviews" ON reviews;
CREATE POLICY "Users can manage their own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);

-- Purchase requests policies
DROP POLICY IF EXISTS "Users can manage their own purchase requests" ON purchase_requests;
CREATE POLICY "Users can manage their own purchase requests" ON purchase_requests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all purchase requests" ON purchase_requests;
CREATE POLICY "Admins can manage all purchase requests" ON purchase_requests FOR ALL USING (is_admin());

-- Purchases policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;
CREATE POLICY "Admins can manage all purchases" ON purchases FOR ALL USING (is_admin());

-- Admin contact info policies
DROP POLICY IF EXISTS "Active admin contacts are publicly viewable" ON admin_contact_info;
CREATE POLICY "Active admin contacts are publicly viewable" ON admin_contact_info FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage their own contact info" ON admin_contact_info;
CREATE POLICY "Admins can manage their own contact info" ON admin_contact_info FOR ALL USING (auth.uid() = admin_id OR is_admin());

-- Payment config policies
DROP POLICY IF EXISTS "Active payment configs are publicly viewable" ON payment_config;
CREATE POLICY "Active payment configs are publicly viewable" ON payment_config FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage payment configs" ON payment_config;
CREATE POLICY "Admins can manage payment configs" ON payment_config FOR ALL USING (is_admin());

-- Admin settings policies
DROP POLICY IF EXISTS "Public can read admin settings" ON admin_settings;
CREATE POLICY "Public can read admin settings" ON admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
CREATE POLICY "Admins can manage admin settings" ON admin_settings FOR ALL USING (is_admin());

-- Purchase screenshots policies
DROP POLICY IF EXISTS "Users can view their own purchase screenshots" ON purchase_screenshots;
CREATE POLICY "Users can view their own purchase screenshots" ON purchase_screenshots FOR SELECT USING (
  purchase_id IN (SELECT id FROM purchases WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage all purchase screenshots" ON purchase_screenshots;
CREATE POLICY "Admins can manage all purchase screenshots" ON purchase_screenshots FOR ALL USING (is_admin());

-- Reading tokens policies
DROP POLICY IF EXISTS "Users can view their own reading tokens" ON reading_tokens;
CREATE POLICY "Users can view their own reading tokens" ON reading_tokens FOR SELECT USING (
  purchase_id IN (SELECT id FROM purchases WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage all reading tokens" ON reading_tokens;
CREATE POLICY "Admins can manage all reading tokens" ON reading_tokens FOR ALL USING (is_admin());

-- Analytics policies
DROP POLICY IF EXISTS "Anyone can create search analytics" ON search_analytics;
CREATE POLICY "Anyone can create search analytics" ON search_analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all analytics" ON search_analytics;
CREATE POLICY "Admins can view all analytics" ON search_analytics FOR SELECT USING (is_admin());

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Analytics events policies
DROP POLICY IF EXISTS "Anyone can create analytics events" ON analytics_events;
CREATE POLICY "Anyone can create analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events" ON analytics_events FOR SELECT USING (is_admin());

-- =============================================
-- STORAGE BUCKETS AND POLICIES
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('book-covers', 'book-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('book-content', 'book-content', false, 52428800, ARRAY['application/pdf', 'application/epub+zip', 'text/plain', 'application/zip']),
  ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view book covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Admins can upload book covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-covers' AND is_admin());
CREATE POLICY "Admins can update book covers" ON storage.objects FOR UPDATE USING (bucket_id = 'book-covers' AND is_admin());
CREATE POLICY "Admins can delete book covers" ON storage.objects FOR DELETE USING (bucket_id = 'book-covers' AND is_admin());

CREATE POLICY "Users can view owned book content" ON storage.objects FOR SELECT USING (
  bucket_id = 'book-content' AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      WHERE ul.user_id = auth.uid() 
      AND ul.status = 'owned'
      AND (name LIKE '%/' || b.id::text || '/%' OR name LIKE b.id::text || '.%')
    )
  )
);

CREATE POLICY "Public can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Admins can manage blog images" ON storage.objects FOR ALL USING (bucket_id = 'blog-images' AND is_admin());

CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can manage their own avatar" ON storage.objects FOR ALL USING (
  bucket_id = 'avatars' AND 
  (name LIKE auth.uid()::text || '/%' OR name LIKE auth.uid()::text || '.%')
);

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================

-- Insert default payment configurations
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order)
VALUES 
  ('bank_account', 'Commercial Bank of Ethiopia', '1000123456789', 'Astewai Digital Bookstore', 'Please include your Order ID in the payment description', 1),
  ('mobile_money', 'Telebirr', '0911123456', 'Astewai Store', 'Send payment to this Telebirr number and include your Order ID', 2),
  ('bank_account', 'Awash Bank', '0012345678901', 'Astewai Digital Bookstore', 'Transfer to Awash Bank account. Include Order ID in the transfer reference.', 3),
  ('mobile_money', 'M-Birr', '0922123456', 'Astewai Digital Bookstore', 'Send via M-Birr mobile wallet. Use Order ID as reference.', 4)
ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('telegram_payment_instructions', 'To purchase this book, please send your payment to one of the following accounts:', 'Payment instructions shown to users in Telegram bot'),
('telegram_help_message', '📚 **Astewai Digital Bookstore Help**

**How to Purchase:**
1️⃣ Visit our website and click "Buy Now" on any book
2️⃣ You''ll be redirected here with payment instructions
3️⃣ Send payment to one of our accounts
4️⃣ Send screenshot or type "PAID" to confirm
5️⃣ We''ll verify and deliver your book within 24 hours

**Payment Methods:**
• Telebirr
• Commercial Bank of Ethiopia (CBE)
• Awash Bank
• M-Birr

**Commands:**
• /help - Show this help message
• /orderstatus [OrderID] - Check your order status

**Support:**
If you need help, please contact our support team with your Order ID.', 'Help message shown in Telegram bot')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- SAMPLE DATA (Optional - remove if not needed)
-- =============================================

-- Insert sample books (only if they don't exist)
INSERT INTO books (title, author, description, price, is_free, category, tags, status) 
SELECT * FROM (VALUES
  ('The Art of Programming', 'Jane Developer', 'A comprehensive guide to software development best practices and methodologies.', 29.99, false, 'Technology', ARRAY['programming', 'software', 'development'], 'approved'),
  ('Free Introduction to Web Development', 'John Coder', 'Learn the basics of HTML, CSS, and JavaScript in this beginner-friendly guide.', 0.00, true, 'Technology', ARRAY['web', 'html', 'css', 'javascript'], 'approved'),
  ('Database Design Fundamentals', 'Sarah Data', 'Master the principles of database design and normalization.', 39.99, false, 'Technology', ARRAY['database', 'sql', 'design'], 'approved')
) AS v(title, author, description, price, is_free, category, tags, status)
WHERE NOT EXISTS (SELECT 1 FROM books WHERE books.title = v.title);

-- Insert sample bundles
INSERT INTO bundles (title, description, price) 
SELECT * FROM (VALUES
  ('Web Development Starter Pack', 'Everything you need to start your web development journey.', 59.99),
  ('Advanced Programming Bundle', 'Take your programming skills to the next level.', 89.99)
) AS v(title, description, price)
WHERE NOT EXISTS (SELECT 1 FROM bundles WHERE bundles.title = v.title);

-- Update search vectors for existing data
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
-- UTILITY FUNCTIONS FOR TELEGRAM INTEGRATION
-- =============================================

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference() 
RETURNS TEXT AS $$ 
DECLARE 
  prefix TEXT := 'AST'; 
  timestamp_part TEXT; 
  random_part TEXT; 
  reference TEXT; 
  counter INTEGER := 0; 
BEGIN 
  timestamp_part := UPPER(SUBSTRING(TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT), 1, 8)); 
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)); 
  reference := prefix || '-' || timestamp_part || '-' || random_part; 
  
  WHILE EXISTS (SELECT 1 FROM purchases WHERE transaction_reference = reference) AND counter < 10 LOOP 
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)); 
    reference := prefix || '-' || timestamp_part || '-' || random_part; 
    counter := counter + 1; 
  END LOOP; 
  
  RETURN reference; 
END; 
$$ LANGUAGE plpgsql;

-- Generate initiation token
CREATE OR REPLACE FUNCTION generate_initiation_token() 
RETURNS TEXT AS $$ 
DECLARE 
  token TEXT; 
  counter INTEGER := 0; 
BEGIN 
  token := gen_random_uuid()::TEXT; 
  
  WHILE EXISTS (SELECT 1 FROM purchases WHERE initiation_token = token) AND counter < 5 LOOP 
    token := gen_random_uuid()::TEXT; 
    counter := counter + 1; 
  END LOOP; 
  
  RETURN token; 
END; 
$$ LANGUAGE plpgsql;

-- Populate missing transaction references
UPDATE purchases 
SET transaction_reference = generate_transaction_reference()
WHERE transaction_reference IS NULL;

-- Populate missing item titles
UPDATE purchases 
SET item_title = COALESCE(
  (SELECT title FROM books WHERE books.id = purchases.item_id AND purchases.item_type = 'book'),
  (SELECT title FROM bundles WHERE bundles.id = purchases.item_id AND purchases.item_type = 'bundle'),
  'Unknown Item'
)
WHERE item_title IS NULL;

-- =============================================
-- SCHEMA VERIFICATION
-- =============================================

-- Verify tables exist
DO $$ 
BEGIN 
  RAISE NOTICE 'Schema setup complete. Verifying tables...';
  
  -- Check core tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Profiles table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books') THEN
    RAISE EXCEPTION 'Books table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bundles') THEN
    RAISE EXCEPTION 'Bundles table not created';
  END IF;
  
  RAISE NOTICE 'All core tables verified successfully!';
  RAISE NOTICE 'Schema setup complete. Your Astewai Digital Bookstore database is ready!';
END $$;
