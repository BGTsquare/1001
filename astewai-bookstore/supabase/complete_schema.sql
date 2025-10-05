BEGIN;

-- Consolidated and optimized schema for Astewai Digital Bookstore
-- Replaces previous migrations. Run in Supabase SQL editor or via supabase db push.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  reading_preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper to check admin role without triggering RLS recursion.
-- Define before any policies so they can reference it safely.
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid AND role = 'admin');
$$;

-- Overload to accept text (e.g., auth.uid() returns TEXT in policy context) and cast safely to UUID.
CREATE OR REPLACE FUNCTION is_admin(user_uuid_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
BEGIN
  IF user_uuid_text IS NULL THEN
    RETURN FALSE;
  END IF;
  BEGIN
    uid := user_uuid_text::UUID;
  EXCEPTION WHEN others THEN
    RETURN FALSE; -- if casting fails, not an admin
  END;
  RETURN (SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'));
END;
$$;

CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.role() = 'anon' AND false OR auth.uid() = id OR is_admin(auth.uid()));
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR is_admin(auth.uid()));

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  content_path TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  bundle_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY books_public_select ON books FOR SELECT USING (true);
CREATE POLICY books_admin_manage ON books FOR ALL USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING GIN(tags);

-- Bundles and relationship
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY bundles_public_select ON bundles FOR SELECT USING (true);
CREATE POLICY bundles_admin_manage ON bundles FOR ALL USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS bundle_books (
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, book_id)
);
ALTER TABLE bundle_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY bundle_books_public_select ON bundle_books FOR SELECT USING (true);
CREATE POLICY bundle_books_admin_manage ON bundle_books FOR ALL USING (is_admin(auth.uid()));

-- User library
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned','pending','completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_read_position TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_library_user ON user_library FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_posts_public ON blog_posts FOR SELECT USING (published = TRUE OR is_admin(auth.uid()) OR auth.uid() = author_id);
CREATE POLICY blog_posts_admin_manage ON blog_posts FOR ALL USING (is_admin(auth.uid()));

-- Purchases simplified: unified payment_requests table (supports previous features)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book','bundle')),
  item_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','payment_initiated','payment_verified','completed','failed','cancelled')),
  selected_wallet_id UUID,
  deep_link_clicked_at TIMESTAMPTZ,
  manual_tx_id TEXT,
  manual_amount NUMERIC(10,2),
  receipt_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ocr_processed_at TIMESTAMPTZ,
  ocr_extracted_tx_id TEXT,
  admin_verified_at TIMESTAMPTZ,
  admin_verified_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  verification_method TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_requests_user ON payment_requests FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_public_select ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_user_manage ON reviews FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Admin contact info
CREATE TABLE IF NOT EXISTS admin_contact_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram','whatsapp','email')),
  contact_value TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_contact_info_public ON admin_contact_info FOR SELECT USING (is_active = TRUE);
CREATE POLICY admin_contact_info_admin_manage ON admin_contact_info FOR ALL USING (is_admin(auth.uid()));

-- Payment config and wallet config
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  config_type TEXT NOT NULL CHECK (config_type IN ('bank_account','mobile_money')),
  provider_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_config_public ON payment_config FOR SELECT USING (is_active = TRUE);
CREATE POLICY payment_config_admin_manage ON payment_config FOR ALL USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS wallet_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  deep_link_template TEXT,
  tx_id_pattern TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  icon_url TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE wallet_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_config_public ON wallet_config FOR SELECT USING (is_active = TRUE);
CREATE POLICY wallet_config_admin_manage ON wallet_config FOR ALL USING (is_admin(auth.uid()));

-- Auto matching rules and verification logs
CREATE TABLE IF NOT EXISTS auto_matching_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  confidence_threshold NUMERIC(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE auto_matching_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY auto_matching_rules_admin_manage ON auto_matching_rules FOR ALL USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS payment_verification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  error_message TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_verification_logs_admin ON payment_verification_logs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY payment_verification_logs_user ON payment_verification_logs FOR SELECT USING (EXISTS (SELECT 1 FROM payment_requests pr WHERE pr.id = payment_verification_logs.payment_request_id AND pr.user_id = auth.uid()) OR is_admin(auth.uid()));

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_subscriptions_user ON push_subscriptions FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_sessions_user ON user_sessions FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_settings_admin ON admin_settings FOR ALL USING (is_admin(auth.uid()));

-- Utility function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to check admin role without triggering RLS recursion.
-- This SECURITY DEFINER function runs with the function owner's privileges
-- so it can read `profiles` to determine admin status when policies are evaluated.
-- (moved earlier)

-- Triggers
DO $$
DECLARE
  t RECORD;
  trig_name TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%' LOOP
    trig_name := format('update_%s_updated_at', t.tablename);
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trig_name) THEN
      EXECUTE FORMAT('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', trig_name, t.tablename);
    END IF;
  END LOOP;
END$$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-content', 'book-content', false, 104857600, ARRAY['application/pdf','application/epub+zip','text/plain'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('bundle-covers', 'bundle-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('payment-confirmations', 'payment-confirmations', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies: keep concise and rely on table policies for complex checks
-- Public buckets: select allowed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'storage_public_read' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    EXECUTE $create$
      CREATE POLICY storage_public_read ON storage.objects FOR SELECT USING (bucket_id IN ('book-covers','bundle-covers'));
    $create$;
  END IF;
END$$;

-- Admin-only management for private buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'storage_admin_manage' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    EXECUTE $create$
  CREATE POLICY storage_admin_manage ON storage.objects FOR ALL USING (is_admin(auth.uid()));
    $create$;
  END IF;
END$$;

-- Book content: allow access if user owns book or is admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'storage_book_content_access' AND schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    EXECUTE $create$
      CREATE POLICY storage_book_content_access ON storage.objects FOR SELECT USING (
        bucket_id = 'book-content' AND (
          EXISTS (
            SELECT 1 FROM user_library ul WHERE ul.user_id = auth.uid() AND ul.book_id::text = split_part(name, '/', 1)
          ) OR is_admin(auth.uid())
        )
      );
    $create$;
  END IF;
END$$;

-- Seed minimal admin settings and payment configs
INSERT INTO admin_settings (key, value) VALUES
  ('site_name','Astewai Digital Bookstore')
ON CONFLICT (key) DO NOTHING;

INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, is_active, display_order)
VALUES
  ('bank_account','Commercial Bank of Ethiopia','1000123456789','Astewai Digital Bookstore','Transfer to CBE account and send screenshot via Telegram',true,1)
ON CONFLICT DO NOTHING;

-- Search Analytics Table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  results_count INTEGER DEFAULT 0,
  search_timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own search analytics
CREATE POLICY "Users can view their own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RLS Policy: Users can insert their own search analytics
CREATE POLICY "Users can insert their own search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  time_period TEXT DEFAULT '30 days',
  search_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  search_query TEXT,
  search_count BIGINT,
  avg_results NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 2) as avg_results
  FROM search_analytics sa
  WHERE sa.search_timestamp >= NOW() - (time_period::INTERVAL)
    AND sa.search_query IS NOT NULL
    AND LENGTH(TRIM(sa.search_query)) > 0
  GROUP BY sa.search_query
  ORDER BY search_count DESC, avg_results DESC
  LIMIT search_limit;
END;
$$;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query TEXT,
  suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  frequency BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return empty if query is too short
  IF LENGTH(TRIM(partial_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    sa.search_query as suggestion,
    COUNT(*) as frequency
  FROM search_analytics sa
  WHERE sa.search_query ILIKE '%' || partial_query || '%'
    AND sa.search_query IS NOT NULL
    AND LENGTH(TRIM(sa.search_query)) > 0
  GROUP BY sa.search_query
  ORDER BY frequency DESC, sa.search_query
  LIMIT suggestion_limit;
END;
$$;

-- Function to track search queries
CREATE OR REPLACE FUNCTION track_search_query(
  query_text TEXT,
  results_count INTEGER DEFAULT 0,
  session_id_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Only track if query is meaningful
  IF LENGTH(TRIM(query_text)) < 2 THEN
    RETURN NULL;
  END IF;

  INSERT INTO search_analytics (
    search_query,
    user_id,
    results_count,
    session_id
  ) VALUES (
    TRIM(query_text),
    auth.uid(),
    results_count,
    session_id_param
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_popular_searches(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_search_query(TEXT, INTEGER, TEXT) TO anon, authenticated;

COMMIT;

-- Notes: Creating an actual auth user must be done via Supabase Auth API (not SQL). Use the provided script `scripts/create-default-admin.js` which uses the service role key to create a user and promote them by inserting/updating `profiles` role.
