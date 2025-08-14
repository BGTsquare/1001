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
ORDER BY column_name;