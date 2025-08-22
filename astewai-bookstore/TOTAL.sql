-- Comprehensive Schema Update for Astewai Digital Bookstore
-- This script fixes all database schema mismatches found during deployment
-- Run this in your Supabase SQL Editor

BEGIN;

-- =============================================
-- 1. Fix profiles table - add missing email column
-- =============================================

-- Add email column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    
    -- Populate email from auth.users for existing profiles
    UPDATE profiles 
    SET email = auth_users.email 
    FROM auth.users auth_users 
    WHERE profiles.id = auth_users.id AND profiles.email IS NULL;
    
  END IF;
END $$;

-- =============================================
-- 2. Fix purchases table - add missing columns
-- =============================================

-- Add missing columns to purchases table
DO $$ 
BEGIN
  -- Add item_title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'item_title') THEN
    ALTER TABLE purchases ADD COLUMN item_title TEXT;
  END IF;
  
  -- Add transaction_reference column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'transaction_reference') THEN
    ALTER TABLE purchases ADD COLUMN transaction_reference TEXT;
  END IF;
  
  -- Add telegram columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id') THEN
    ALTER TABLE purchases ADD COLUMN telegram_chat_id BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'telegram_user_id') THEN
    ALTER TABLE purchases ADD COLUMN telegram_user_id BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'amount_in_birr') THEN
    ALTER TABLE purchases ADD COLUMN amount_in_birr INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'initiation_token') THEN
    ALTER TABLE purchases ADD COLUMN initiation_token TEXT;
  END IF;
END $$;

-- =============================================
-- 3. Fix bundles table - add missing cover image column
-- =============================================

-- Add cover_image_url to bundles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bundles' AND column_name = 'cover_image_url') THEN
    ALTER TABLE bundles ADD COLUMN cover_image_url TEXT;
  END IF;
END $$;

-- =============================================
-- 4. Create missing tables
-- =============================================

-- Create admin_settings table (for Telegram and other admin configurations)
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_screenshots table
CREATE TABLE IF NOT EXISTS purchase_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  telegram_file_id TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading_tokens table
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

-- Create payment_config table (for Ethiopian payment methods)
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('bank_account', 'mobile_money')),
  provider_name VARCHAR(100) NOT NULL UNIQUE, -- 'telebirr', 'cbe', 'awash', 'mbirr', etc.
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_details JSONB DEFAULT '{}', -- Additional details like branch, etc.
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  instructions TEXT, -- Specific instructions for this payment method
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push_subscriptions table (for web push notifications)
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

-- =============================================
-- 5. Update existing data to have proper values
-- =============================================

-- Update purchases to have transaction references if missing
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;

-- Update purchases to have item_title based on their item_type and item_id
UPDATE purchases 
SET item_title = COALESCE(
  (SELECT title FROM books WHERE books.id = purchases.item_id AND purchases.item_type = 'book'),
  (SELECT title FROM bundles WHERE bundles.id = purchases.item_id AND purchases.item_type = 'bundle'),
  'Unknown Item'
)
WHERE item_title IS NULL;

-- =============================================
-- 6. Insert default configuration data
-- =============================================

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('telegram_payment_instructions', 'To purchase this book, please send your payment to one of the following accounts:', 'Payment instructions shown to users in Telegram bot'),
('telegram_help_message', '📚 **Astewai Digital Bookstore Help**

**How to Purchase:**
1️⃣ Visit our website and click "Buy Now" on any book
2️⃣ You''''ll be redirected here with payment instructions
3️⃣ Send payment to one of our accounts
4️⃣ Send screenshot or type "PAID" to confirm
5️⃣ We''''ll verify and deliver your book within 24 hours

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

-- Insert default payment configurations for Ethiopian payment methods
INSERT INTO payment_config (config_type, provider_name, account_name, account_number, account_details, is_active, display_order, instructions) VALUES
('mobile_money', 'telebirr', 'Astewai Digital Bookstore', '0911123456', '{\"type\": \"mobile_wallet\", \"country\": \"ET\"}', true, 1, 'Send money via Telebirr app using the account number above. Include your Order ID in the reference.'),
('bank_account', 'cbe', 'Astewai Digital Bookstore', '1000123456789', '{\"bank_code\": \"CBE\", \"branch\": \"Main Branch\", \"country\": \"ET\"}', true, 2, 'Transfer to Commercial Bank of Ethiopia account. Use your Order ID as reference.'),
('bank_account', 'awash', 'Astewai Digital Bookstore', '0012345678901', '{\"bank_code\": \"AWASH\", \"branch\": \"Addis Ababa\", \"country\": \"ET\"}', true, 3, 'Transfer to Awash Bank account. Include Order ID in the transfer reference.'),
('mobile_money', 'mbirr', 'Astewai Digital Bookstore', '0922123456', '{\"type\": \"mobile_wallet\", \"provider\": \"mbirr\", \"country\": \"ET\"}', true, 4, 'Send via M-Birr mobile wallet. Use Order ID as reference.')
ON CONFLICT (provider_name) DO NOTHING;

-- =============================================
-- 7. Create indexes for performance
-- =============================================

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_purchases_item_title ON purchases(item_title);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_user_id ON purchases(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_purchase_screenshots_purchase_id ON purchase_screenshots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_token ON reading_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_purchase_id ON reading_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payment_config_provider_name ON payment_config(provider_name);
CREATE INDEX IF NOT EXISTS idx_payment_config_is_active ON payment_config(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- =============================================
-- 8. Enable Row Level Security (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. Create RLS Policies
-- =============================================

-- Admin settings policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
  DROP POLICY IF EXISTS "Public can read admin settings" ON admin_settings;
  
  CREATE POLICY "Admins can manage admin settings" ON admin_settings
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  
  CREATE POLICY "Public can read admin settings" ON admin_settings
    FOR SELECT USING (true);
END $$;

-- Purchase screenshots policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own purchase screenshots" ON purchase_screenshots;
  DROP POLICY IF EXISTS "Admins can manage all purchase screenshots" ON purchase_screenshots;
  
  CREATE POLICY "Users can view their own purchase screenshots" ON purchase_screenshots
    FOR SELECT USING (
      purchase_id IN (
        SELECT id FROM purchases WHERE user_id = auth.uid()
      )
    );
  
  CREATE POLICY "Admins can manage all purchase screenshots" ON purchase_screenshots
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Reading tokens policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own reading tokens" ON reading_tokens;
  DROP POLICY IF EXISTS "Admins can manage all reading tokens" ON reading_tokens;
  
  CREATE POLICY "Users can view their own reading tokens" ON reading_tokens
    FOR SELECT USING (
      purchase_id IN (
        SELECT id FROM purchases WHERE user_id = auth.uid()
      )
    );
  
  CREATE POLICY "Admins can manage all reading tokens" ON reading_tokens
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Payment config policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can read active payment configs" ON payment_config;
  DROP POLICY IF EXISTS "Admins can manage payment configs" ON payment_config;
  
  CREATE POLICY "Public can read active payment configs" ON payment_config
    FOR SELECT USING (is_active = true);
  
  CREATE POLICY "Admins can manage payment configs" ON payment_config
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Push subscriptions policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
  DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON push_subscriptions;
  
  CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (user_id = auth.uid());
  
  CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- =============================================
-- 10. Add triggers for updated_at timestamps
-- =============================================

-- Trigger for admin_settings
DROP TRIGGER IF EXISTS admin_settings_updated_at ON admin_settings;
CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger for payment_config
DROP TRIGGER IF EXISTS payment_config_updated_at ON payment_config;
CREATE TRIGGER payment_config_updated_at
  BEFORE UPDATE ON payment_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger for push_subscriptions
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- 11. Update the profile creation function to include email
-- =============================================

-- Update the function to handle new user creation with email
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

COMMIT;

-- =============================================
-- Verification queries (run these to check if everything worked)
-- =============================================

-- Check if columns were added successfully
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'purchases', 'bundles')
  AND column_name IN ('email', 'item_title', 'transaction_reference', 'cover_image_url', 'telegram_chat_id', 'telegram_user_id', 'amount_in_birr', 'initiation_token')
ORDER BY table_name, column_name;

-- Check if new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_settings', 'purchase_screenshots', 'reading_tokens', 'payment_config', 'push_subscriptions')
ORDER BY table_name;

-- Check if default data was inserted
SELECT 'admin_settings' as table_name, count(*) as row_count FROM admin_settings
UNION ALL
SELECT 'payment_config', count(*) FROM payment_config;
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
-- Add missing columns for Telegram integration
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);

-- Update existing purchases
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;
-- Add missing columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);

-- Update existing purchases to have transaction references
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;

-- Verify columns were added (should show 5 rows)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name IN ('telegram_chat_id', 'telegram_user_id', 'amount_in_birr', 'initiation_token', 'transaction_reference')
ORDER BY column_name;
-- Script to add missing columns to purchases table for Telegram integration
-- Run this in your Supabase SQL Editor

-- Add missing columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);

-- Update existing purchases to have transaction references if they don't have them
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name IN ('telegram_chat_id', 'telegram_user_id', 'amount_in_birr', 'initiation_token', 'transaction_reference')
ORDER BY column_name;-- Add Telegram fields to purchases table if they don't exist
DO $$ 
BEGIN
  -- Add telegram_chat_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'telegram_chat_id') THEN
    ALTER TABLE purchases ADD COLUMN telegram_chat_id BIGINT;
  END IF;

  -- Add telegram_user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'telegram_user_id') THEN
    ALTER TABLE purchases ADD COLUMN telegram_user_id BIGINT;
  END IF;

  -- Add amount_in_birr column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'amount_in_birr') THEN
    ALTER TABLE purchases ADD COLUMN amount_in_birr INTEGER;
  END IF;

  -- Add initiation_token column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'initiation_token') THEN
    ALTER TABLE purchases ADD COLUMN initiation_token TEXT;
  END IF;
END $$;

-- Create purchase_screenshots table for storing payment proof
CREATE TABLE IF NOT EXISTS purchase_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  telegram_file_id TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading_tokens table for secure book access
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

-- Create admin_settings table for configurable messages
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings (only if they don't exist)
INSERT INTO admin_settings (key, value, description) 
SELECT 'telegram_payment_instructions', 'To purchase this book, please send your payment to one of the following accounts:', 'Payment instructions shown to users in Telegram bot'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'telegram_payment_instructions');

INSERT INTO admin_settings (key, value, description) 
SELECT 'telegram_help_message', '📚 **Astewai Digital Bookstore Help**

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
If you need help, please contact our support team with your Order ID.', 'Help message shown in Telegram bot'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'telegram_help_message');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchase_screenshots_purchase_id ON purchase_screenshots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_token ON reading_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_purchase_id ON reading_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS on new tables
ALTER TABLE purchase_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Purchase screenshots policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own purchase screenshots" ON purchase_screenshots;
  DROP POLICY IF EXISTS "Admins can view all purchase screenshots" ON purchase_screenshots;

  -- Create new policies
  CREATE POLICY "Users can view their own purchase screenshots" ON purchase_screenshots
    FOR SELECT USING (
      purchase_id IN (
        SELECT id FROM purchases WHERE user_id = auth.uid()
      )
    );

  CREATE POLICY "Admins can view all purchase screenshots" ON purchase_screenshots
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Reading tokens policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own reading tokens" ON reading_tokens;
  DROP POLICY IF EXISTS "Admins can manage all reading tokens" ON reading_tokens;

  -- Create new policies
  CREATE POLICY "Users can view their own reading tokens" ON reading_tokens
    FOR SELECT USING (
      purchase_id IN (
        SELECT id FROM purchases WHERE user_id = auth.uid()
      )
    );

  CREATE POLICY "Admins can manage all reading tokens" ON reading_tokens
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Admin settings policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
  DROP POLICY IF EXISTS "Public can read admin settings" ON admin_settings;

  -- Create new policies
  CREATE POLICY "Admins can manage admin settings" ON admin_settings
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

  CREATE POLICY "Public can read admin settings" ON admin_settings
    FOR SELECT USING (true);
END $$;-- Telegram Bot Manual Payment System Migration (Corrected for Function Signature Change)
-- This script refactors the payment system to use a Telegram bot for manual verification.

-- =============================================
-- UTILITY FUNCTION FOR TIMESTAMPS (MUST BE FIRST)
-- =============================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PREPARE PURCHASES TABLE FOR NEW CONSTRAINTS
-- =============================================
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS initiation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100) UNIQUE;

-- Clean up existing data before applying new constraint
UPDATE purchases SET status = 'completed' WHERE status = 'approved';
UPDATE purchases SET status = 'completed' WHERE status = 'pending';
UPDATE purchases SET status = 'completed' WHERE status IS NULL;

-- Drop and re-add the constraint with new values
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check;
ALTER TABLE purchases 
ADD CONSTRAINT purchases_status_check 
CHECK (status IN ('pending_initiation', 'awaiting_payment', 'pending_verification', 'completed', 'rejected'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_user ON purchases(telegram_user_id, telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pending_verification ON purchases(status, created_at) 
  WHERE status = 'pending_verification';

-- =============================================
-- CREATE PAYMENT CONFIGURATION TABLE
-- =============================================
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

-- Add indexes for payment config queries
CREATE INDEX IF NOT EXISTS idx_payment_config_active ON payment_config(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_payment_config_type ON payment_config(config_type, is_active);

-- Drop existing trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS payment_config_updated_at ON payment_config;
CREATE TRIGGER payment_config_updated_at
  BEFORE UPDATE ON payment_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- INSERT DEFAULT PAYMENT CONFIGURATIONS
-- =============================================
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order)
VALUES 
  ('bank_account', 'Commercial Bank of Ethiopia', '1000123456789', 'Astewai Digital Bookstore', 'Please include your transaction reference in the payment description', 1),
  ('mobile_money', 'Telebirr', '0911123456', 'Astewai Store', 'Send payment to this Telebirr number and include your transaction reference', 2)
ON CONFLICT DO NOTHING;

-- =============================================
-- UPDATE ROW LEVEL SECURITY POLICIES
-- =============================================
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active payment configs are publicly readable" ON payment_config;
CREATE POLICY "Active payment configs are publicly readable" ON payment_config
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage payment configs" ON payment_config;
CREATE POLICY "Admins can manage payment configs" ON payment_config
  FOR ALL USING (is_admin());

-- =============================================
-- UTILITY FUNCTIONS FOR TELEGRAM PAYMENT WORKFLOW
-- =============================================

-- (Functions that are NOT changing return type can stay as they are)
CREATE OR REPLACE FUNCTION generate_transaction_reference() RETURNS TEXT AS $$ DECLARE prefix TEXT := 'AST'; timestamp_part TEXT; random_part TEXT; reference TEXT; counter INTEGER := 0; BEGIN timestamp_part := UPPER(SUBSTRING(TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT), 1, 8)); random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)); reference := prefix || '-' || timestamp_part || '-' || random_part; WHILE EXISTS (SELECT 1 FROM purchases WHERE transaction_reference = reference) AND counter < 10 LOOP random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)); reference := prefix || '-' || timestamp_part || '-' || random_part; counter := counter + 1; END LOOP; RETURN reference; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION generate_initiation_token() RETURNS TEXT AS $$ DECLARE token TEXT; counter INTEGER := 0; BEGIN token := gen_random_uuid()::TEXT; WHILE EXISTS (SELECT 1 FROM purchases WHERE initiation_token = token) AND counter < 5 LOOP token := gen_random_uuid()::TEXT; counter := counter + 1; END LOOP; RETURN token; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION find_purchase_by_token(token_param TEXT) RETURNS TABLE(purchase_id UUID, user_id UUID, user_email TEXT, user_name TEXT, item_type TEXT, item_id UUID, item_title TEXT, amount DECIMAL, status TEXT, transaction_reference TEXT, created_at TIMESTAMPTZ) AS $$ BEGIN RETURN QUERY SELECT p.id, p.user_id, u.email, COALESCE(pr.display_name, u.email), p.item_type, p.item_id, CASE WHEN p.item_type = 'book' THEN b.title WHEN p.item_type = 'bundle' THEN bu.title ELSE 'Unknown Item' END, p.amount, p.status, p.transaction_reference, p.created_at FROM purchases p LEFT JOIN auth.users u ON p.user_id = u.id LEFT JOIN profiles pr ON p.user_id = pr.id LEFT JOIN books b ON p.item_type = 'book' AND p.item_id = b.id LEFT JOIN bundles bu ON p.item_type = 'bundle' AND p.item_id = bu.id WHERE p.initiation_token = token_param LIMIT 1; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- **** THE FIX IS HERE ****
-- Drop the old version of the function because its return type is changing.
DROP FUNCTION IF EXISTS get_pending_purchases(integer, integer);

-- Now, create the new version of the function with the updated return columns.
CREATE OR REPLACE FUNCTION get_pending_purchases(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  purchase_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  item_type TEXT,
  item_id UUID,
  item_title TEXT,
  amount DECIMAL,
  transaction_reference TEXT,
  telegram_chat_id BIGINT,
  telegram_user_id BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as purchase_id,
    p.user_id,
    u.email as user_email,
    COALESCE(pr.display_name, u.email) as user_name,
    p.item_type,
    p.item_id,
    CASE 
      WHEN p.item_type = 'book' THEN b.title
      WHEN p.item_type = 'bundle' THEN bu.title
      ELSE 'Unknown Item'
    END as item_title,
    p.amount,
    p.transaction_reference,
    p.telegram_chat_id,
    p.telegram_user_id,
    p.created_at,
    p.updated_at
  FROM purchases p
  LEFT JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN profiles pr ON p.user_id = pr.id
  LEFT JOIN books b ON p.item_type = 'book' AND p.item_id = b.id
  LEFT JOIN bundles bu ON p.item_type = 'bundle' AND p.item_id = bu.id
  WHERE p.status = 'pending_verification'
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- **** END OF FIX ****


CREATE OR REPLACE FUNCTION approve_purchase(purchase_id_param UUID) RETURNS BOOLEAN AS $$ DECLARE purchase_record RECORD; BEGIN SELECT * INTO purchase_record FROM purchases WHERE id = purchase_id_param AND status = 'pending_verification'; IF NOT FOUND THEN RETURN FALSE; END IF; UPDATE purchases SET status = 'completed', updated_at = NOW() WHERE id = purchase_id_param; IF purchase_record.item_type = 'book' THEN INSERT INTO user_library (user_id, book_id, status, added_at) VALUES (purchase_record.user_id, purchase_record.item_id, 'owned', NOW()) ON CONFLICT (user_id, book_id) DO NOTHING; ELSIF purchase_record.item_type = 'bundle' THEN INSERT INTO user_library (user_id, book_id, status, added_at) SELECT purchase_record.user_id, bb.book_id, 'owned', NOW() FROM bundle_books bb WHERE bb.bundle_id = purchase_record.item_id ON CONFLICT (user_id, book_id) DO NOTHING; END IF; RETURN TRUE; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION reject_purchase(purchase_id_param UUID) RETURNS BOOLEAN AS $$ BEGIN UPDATE purchases SET status = 'rejected', updated_at = NOW() WHERE id = purchase_id_param AND status = 'pending_verification'; RETURN FOUND; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CLEANUP AND OPTIMIZATION
-- =============================================
COMMENT ON COLUMN purchases.status IS 'Purchase status: pending_initiation, awaiting_payment, pending_verification, completed, rejected';
COMMENT ON COLUMN purchases.telegram_chat_id IS 'Telegram chat ID for bot communication';
COMMENT ON COLUMN purchases.telegram_user_id IS 'Telegram user ID for bot user identification';
COMMENT ON COLUMN purchases.initiation_token IS 'Single-use token for secure Telegram bot linking';
COMMENT ON COLUMN purchases.transaction_reference IS 'Unique reference code for manual payment tracking';
COMMENT ON TABLE payment_config IS 'Configuration for manual payment methods (bank accounts, mobile money)';

ANALYZE purchases;
ANALYZE payment_config;-- Add sample cover images to existing books and bundles
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
COMMENT ON COLUMN bundles.cover_image_url IS 'URL to the bundle cover image - updated with sample images for demo purposes';-- Add cover_image_url column to bundles table
-- Run this in your Supabase SQL Editor or database console

ALTER TABLE bundles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bundles' 
AND column_name = 'cover_image_url';-- Add cover_image_url field to bundles table
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;-- Storage Setup for Astewai Digital Bookstore
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
  );-- Storage Setup for Astewai Digital Bookstore
-- Run this in your Supabase SQL Editor

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
  );-- Updated Seed Data for Astewai Digital Bookstore
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
WHERE search_vector IS NULL;-- Complete Database Schema for Astewai Digital Bookstore
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