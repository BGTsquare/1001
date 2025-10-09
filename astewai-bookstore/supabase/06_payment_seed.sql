-- SEED: Payment wallet configs
-- Inserts sample wallet configs for TellBirr, CBE (mobile app), and manual bank transfer
-- Run this in Supabase SQL editor or via psql after the tables are created.

BEGIN;

INSERT INTO public.wallet_config (id, wallet_name, wallet_type, deep_link_template, instructions, account_details, is_active, display_order, icon_url)
VALUES
  (
    uuid_generate_v4(),
    'TellBirr',
    'mobile_money',
    'tellbirr://pay?amount={amount}&reference={reference}',
    'Open the TellBirr app and complete the payment. Use the reference shown on this page when uploading the receipt.',
    '{"phone":"+251912345678","business_name":"AsteWai Books"}'::jsonb,
    TRUE,
    1,
    NULL
  ),
  (
    uuid_generate_v4(),
    'CBE Mobile App',
    'bank_app',
    'cbe://transfer?amount={amount}&ref={reference}',
    'Open the CBE Mobile App and follow the transfer flow. Use the reference when uploading the receipt.',
    '{"support_email":"payments@astewai.example","help_phone":"+251911000000"}'::jsonb,
    TRUE,
    2,
    NULL
  ),
  (
    uuid_generate_v4(),
    'CBE Bank (Manual Transfer)',
    'manual_bank',
    NULL,
    'Make a manual bank transfer to the account below and upload the bank transfer screenshot as proof.',
    '{"bank":"Commercial Bank of Ethiopia","account_number":"0123456789","account_name":"AsteWai Books","branch":"Addis Ababa"}'::jsonb,
    TRUE,
    3,
    NULL
  );

COMMIT;

-- Quick verification query (optional):
-- SELECT id, wallet_name, wallet_type, deep_link_template, account_details, is_active, display_order FROM public.wallet_config ORDER BY display_order;
