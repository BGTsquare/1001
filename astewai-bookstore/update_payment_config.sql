-- Update payment configuration with proper Ethiopian payment methods
-- Run this in your Supabase SQL editor

-- Clear existing configs
DELETE FROM payment_config;

-- Insert Ethiopian payment methods
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order, is_active)
VALUES 
  (
    'mobile_money', 
    'Telebirr', 
    '0911123456', 
    'Astewai Digital Bookstore', 
    'Send payment to this Telebirr number. Include your transaction reference in the payment description.', 
    1, 
    true
  ),
  (
    'bank_account', 
    'Commercial Bank of Ethiopia (CBE)', 
    '1000123456789', 
    'Astewai Digital Bookstore', 
    'Transfer to this CBE account. Use your transaction reference as the transfer description.', 
    2, 
    true
  ),
  (
    'bank_account', 
    'Awash Bank', 
    '01320123456789', 
    'Astewai Digital Bookstore', 
    'Transfer to this Awash Bank account. Include your transaction reference in the transfer note.', 
    3, 
    true
  ),
  (
    'mobile_money', 
    'M-Birr', 
    '0922123456', 
    'Astewai Store', 
    'Send payment via M-Birr. Include your transaction reference in the payment note.', 
    4, 
    true
  );

-- Verify the data
SELECT * FROM payment_config ORDER BY display_order;