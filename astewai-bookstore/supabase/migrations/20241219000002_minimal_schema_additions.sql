-- Minimal migration to add only missing columns and tables
-- No policies to avoid conflicts

-- Add missing columns to profiles table
DO $$
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
  
  -- Add telegram columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'telegram_chat_id') THEN
    ALTER TABLE profiles ADD COLUMN telegram_chat_id BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'telegram_username') THEN
    ALTER TABLE profiles ADD COLUMN telegram_username TEXT;
  END IF;
END $$;

-- Add missing columns to purchases table
DO $$
BEGIN
  -- Add item_title column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'item_title') THEN
    ALTER TABLE purchases ADD COLUMN item_title TEXT;
  END IF;
  
  -- Add transaction_reference column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'transaction_reference') THEN
    ALTER TABLE purchases ADD COLUMN transaction_reference TEXT;
  END IF;
END $$;

-- Create admin_settings table if not exists
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create purchase_screenshots table if not exists
CREATE TABLE IF NOT EXISTS purchase_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reading_tokens table if not exists
CREATE TABLE IF NOT EXISTS reading_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- Create payment_config table if not exists
CREATE TABLE IF NOT EXISTS payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create push_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_purchase_screenshots_purchase_id ON purchase_screenshots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_user_book ON reading_tokens(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_token ON reading_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_expires ON reading_tokens(expires_at);

-- Insert default payment configuration if not exists
INSERT INTO payment_config (key, value) 
VALUES 
    ('flutterwave', '{"public_key": "", "secret_key": "", "encryption_key": "", "enabled": true}'),
    ('paystack', '{"public_key": "", "secret_key": "", "enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- Insert default admin settings if not exists
INSERT INTO admin_settings (key, value, description) 
VALUES 
    ('telegram_bot_token', '""', 'Telegram bot token for notifications'),
    ('notification_enabled', 'true', 'Enable/disable push notifications'),
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;
