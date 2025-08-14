-- Manual Payment System Migration
-- This migration adds support for manual payment processing

-- UPDATE PURCHASES TABLE FOR MANUAL PAYMENTS

-- Drop existing status check constraint and recreate with new values
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check;

-- Add new status constraint with Telegram bot workflow statuses
ALTER TABLE purchases 
ADD CONSTRAINT purchases_status_check 
CHECK (status IN ('pending_initiation', 'awaiting_payment', 'pending_verification', 'completed', 'rejected'));

-- Add Telegram bot integration columns
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS initiation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100) UNIQUE;

-- Update existing records to have proper status
-- Convert old 'approved' status to 'completed' for consistency
UPDATE purchases SET status = 'completed' WHERE status = 'approved';

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_user ON purchases(telegram_user_id, telegram_chat_id);

-- Add index for pending purchases queries (most common admin query)
CREATE INDEX IF NOT EXISTS idx_purchases_pending_verification ON purchases(status, created_at) 
  WHERE status = 'pending_verification';

-- CREATE PAYMENT CONFIGURATION TABLE

-- Table to store bank account and mobile money payment details
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('bank_account', 'mobile_money')),
  provider_name VARCHAR(100) NOT NULL, -- 'CBE', 'Telebirr', 'M-Pesa', etc.
  account_number VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  instructions TEXT, -- Additional payment instructions
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For ordering payment options
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for payment config queries
CREATE INDEX IF NOT EXISTS idx_payment_config_active ON payment_config(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_payment_config_type ON payment_config(config_type, is_active);

-- Add updated_at trigger for payment_config
DROP TRIGGER IF EXISTS payment_config_updated_at ON payment_config;
CREATE TRIGGER payment_config_updated_at
  BEFORE UPDATE ON payment_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- INSERT DEFAULT PAYMENT CONFIGURATIONS

-- Insert default bank account configuration (placeholder)
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order)
VALUES 
  ('bank_account', 'Commercial Bank of Ethiopia', '1000123456789', 'Astewai Digital Bookstore', 'Please include your transaction reference in the payment description', 1),
  ('mobile_money', 'Telebirr', '0911123456', 'Astewai Store', 'Send payment to this Telebirr number and include your transaction reference', 2)
ON CONFLICT DO NOTHING;

-- UPDATE ROW LEVEL SECURITY POLICIES

-- Enable RLS on payment_config table
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Payment config policies (publicly readable for active configs, admin manageable)
DROP POLICY IF EXISTS "Active payment configs are publicly readable" ON payment_config;
CREATE POLICY "Active payment configs are publicly readable" ON payment_config
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage payment configs" ON payment_config;
CREATE POLICY "Admins can manage payment configs" ON payment_config
  FOR ALL USING (is_admin());

-- UTILITY FUNCTIONS FOR MANUAL PAYMENTS

-- Function to generate unique transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'AST';
  timestamp_part TEXT;
  random_part TEXT;
  reference TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate timestamp part (base36 for shorter string)
  timestamp_part := UPPER(SUBSTRING(TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT), 1, 8));
  
  -- Generate random part
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
  
  -- Combine parts
  reference := prefix || '-' || timestamp_part || '-' || random_part;
  
  -- Ensure uniqueness (retry if collision)
  WHILE EXISTS (SELECT 1 FROM purchases WHERE transaction_reference = reference) AND counter < 10 LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    reference := prefix || '-' || timestamp_part || '-' || random_part;
    counter := counter + 1;
  END LOOP;
  
  RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique initiation token for Telegram bot
CREATE OR REPLACE FUNCTION generate_initiation_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate UUID-based token
  token := gen_random_uuid()::TEXT;
  
  -- Ensure uniqueness (retry if collision, though UUID collision is extremely unlikely)
  WHILE EXISTS (SELECT 1 FROM purchases WHERE initiation_token = token) AND counter < 5 LOOP
    token := gen_random_uuid()::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to find purchase by initiation token (for Telegram bot)
CREATE OR REPLACE FUNCTION find_purchase_by_token(token_param TEXT)
RETURNS TABLE(
  purchase_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  item_type TEXT,
  item_id UUID,
  item_title TEXT,
  amount DECIMAL,
  status TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMPTZ
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
    p.status,
    p.transaction_reference,
    p.created_at
  FROM purchases p
  LEFT JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN profiles pr ON p.user_id = pr.id
  LEFT JOIN books b ON p.item_type = 'book' AND p.item_id = b.id
  LEFT JOIN bundles bu ON p.item_type = 'bundle' AND p.item_id = bu.id
  WHERE p.initiation_token = token_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending purchases with user details (for admin dashboard)
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

-- Function to approve a purchase and add to library
CREATE OR REPLACE FUNCTION approve_purchase(purchase_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  purchase_record RECORD;
BEGIN
  -- Get purchase details
  SELECT * INTO purchase_record 
  FROM purchases 
  WHERE id = purchase_id_param AND status = 'pending_verification';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update purchase status
  UPDATE purchases 
  SET status = 'completed', updated_at = NOW()
  WHERE id = purchase_id_param;
  
  -- Add to user library based on item type
  IF purchase_record.item_type = 'book' THEN
    -- Add single book to library
    INSERT INTO user_library (user_id, book_id, status, added_at)
    VALUES (purchase_record.user_id, purchase_record.item_id, 'owned', NOW())
    ON CONFLICT (user_id, book_id) DO NOTHING;
    
  ELSIF purchase_record.item_type = 'bundle' THEN
    -- Add all books in bundle to library
    INSERT INTO user_library (user_id, book_id, status, added_at)
    SELECT purchase_record.user_id, bb.book_id, 'owned', NOW()
    FROM bundle_books bb
    WHERE bb.bundle_id = purchase_record.item_id
    ON CONFLICT (user_id, book_id) DO NOTHING;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a purchase
CREATE OR REPLACE FUNCTION reject_purchase(purchase_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update purchase status to rejected
  UPDATE purchases 
  SET status = 'rejected', updated_at = NOW()
  WHERE id = purchase_id_param AND status = 'pending_verification';
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CLEANUP AND OPTIMIZATION

-- Add comments to purchases table documenting the new columns
COMMENT ON COLUMN purchases.status IS 'Purchase status: pending_initiation, awaiting_payment, pending_verification, completed, rejected';
COMMENT ON COLUMN purchases.telegram_chat_id IS 'Telegram chat ID for bot communication';
COMMENT ON COLUMN purchases.telegram_user_id IS 'Telegram user ID for bot user identification';
COMMENT ON COLUMN purchases.initiation_token IS 'Single-use token for secure Telegram bot linking';
COMMENT ON COLUMN purchases.transaction_reference IS 'Unique reference code for manual payment tracking';

-- Add comment to payment_config table
COMMENT ON TABLE payment_config IS 'Configuration for manual payment methods (bank accounts, mobile money)';

-- Update table statistics for better query planning
ANALYZE purchases;
ANALYZE payment_config;