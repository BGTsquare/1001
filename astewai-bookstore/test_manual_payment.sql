-- Test script for manual payment system
-- Run this in your Supabase SQL editor to verify everything works

-- Test 1: Check if payment_config table exists and has data
SELECT 'Payment Config Test' as test_name, count(*) as record_count FROM payment_config;

-- Test 2: Generate a transaction reference
SELECT 'Transaction Reference Test' as test_name, generate_transaction_reference() as reference;

-- Test 3: Generate an initiation token
SELECT 'Initiation Token Test' as test_name, generate_initiation_token() as token;

-- Test 4: Check purchases table has new columns
SELECT 
  'Purchases Table Structure' as test_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
  AND column_name IN ('telegram_chat_id', 'telegram_user_id', 'initiation_token', 'transaction_reference')
ORDER BY column_name;

-- Test 5: Check if new indexes exist
SELECT 
  'Indexes Test' as test_name,
  indexname
FROM pg_indexes 
WHERE tablename = 'purchases' 
  AND indexname LIKE '%telegram%' OR indexname LIKE '%token%' OR indexname LIKE '%reference%'
ORDER BY indexname;