-- Test the manual payment system functions
-- Run this in your Supabase SQL editor

-- Test 1: Generate transaction reference
SELECT 'Transaction Reference' as test, generate_transaction_reference() as result;

-- Test 2: Generate initiation token  
SELECT 'Initiation Token' as test, generate_initiation_token() as result;

-- Test 3: Check if is_admin function exists
SELECT 'Admin Check' as test, is_admin() as result;

-- Test 4: Check purchases table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 5: Check payment_config table
SELECT * FROM payment_config LIMIT 3;