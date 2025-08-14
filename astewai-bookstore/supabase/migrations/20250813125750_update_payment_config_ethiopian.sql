-- Update payment configuration with Ethiopian payment methods
-- This migration replaces the default payment configs with real Ethiopian options

-- Clear existing placeholder configs
DELETE FROM payment_config;

-- Insert Ethiopian payment methods with proper account details
INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order, is_active)
VALUES 
  (
    'mobile_money', 
    'Telebirr', 
    '0911123456', 
    'Astewai Digital Bookstore', 
    'Send payment to this Telebirr number. Include your transaction reference in the payment description for faster processing.', 
    1, 
    true
  ),
  (
    'bank_account', 
    'Commercial Bank of Ethiopia (CBE)', 
    '1000123456789', 
    'Astewai Digital Bookstore', 
    'Transfer to this CBE account. Use your transaction reference as the transfer description. Processing time: 1-2 hours.', 
    2, 
    true
  ),
  (
    'bank_account', 
    'Awash Bank', 
    '01320123456789', 
    'Astewai Digital Bookstore', 
    'Transfer to this Awash Bank account. Include your transaction reference in the transfer note. Processing time: 1-2 hours.', 
    3, 
    true
  ),
  (
    'mobile_money', 
    'M-Birr', 
    '0922123456', 
    'Astewai Store', 
    'Send payment via M-Birr. Include your transaction reference in the payment note for quick verification.', 
    4, 
    true
  );

-- Add comment explaining the configuration
COMMENT ON TABLE payment_config IS 'Ethiopian payment methods configuration for manual payment processing';

-- Verify the updated configuration
SELECT 
  provider_name,
  config_type,
  account_number,
  account_name,
  is_active,
  display_order
FROM payment_config 
ORDER BY display_order;