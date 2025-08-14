-- Simple Telegram migration - run this directly on your Supabase database
-- Go to your Supabase dashboard > SQL Editor and run this script

-- Add Telegram fields to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT;

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

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchase_screenshots_purchase_id ON purchase_screenshots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_token ON reading_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reading_tokens_purchase_id ON reading_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS
ALTER TABLE purchase_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "Admins can manage admin settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can read admin settings" ON admin_settings
  FOR SELECT USING (true);