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
