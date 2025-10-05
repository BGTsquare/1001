-- =============================================
-- NEW SIMPLIFIED PAYMENT SYSTEM MIGRATION
-- =============================================
-- This migration creates a simplified payment system with:
-- 1. Deep-link wallet integration
-- 2. Manual TX ID entry
-- 3. OCR receipt processing
-- 4. Auto-matching logic
-- 5. Admin verification dashboard
-- =============================================

-- Drop existing payment-related tables and recreate with new schema
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS payment_config CASCADE;
DROP TABLE IF EXISTS purchase_requests CASCADE;

-- =============================================
-- WALLET_CONFIG TABLE
-- =============================================
-- Configuration for wallet deep-links and payment methods
CREATE TABLE IF NOT EXISTS wallet_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('mobile_money', 'bank_app', 'crypto')),
  deep_link_template TEXT NOT NULL,
  tx_id_pattern TEXT, -- Regex pattern for TX ID validation
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon_url TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wallet_config
ALTER TABLE wallet_config ENABLE ROW LEVEL SECURITY;

-- Wallet_config RLS policies
CREATE POLICY "Active wallet configs are publicly readable" ON wallet_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage wallet configs" ON wallet_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_config_wallet_type ON wallet_config(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallet_config_is_active ON wallet_config(is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_config_display_order ON wallet_config(display_order);

-- =============================================
-- PAYMENT_REQUESTS TABLE
-- =============================================
-- Simplified payment requests with wallet integration
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'payment_initiated', 'payment_verified', 'completed', 'failed', 'cancelled')),
  
  -- Wallet integration fields
  selected_wallet_id UUID REFERENCES wallet_config(id),
  deep_link_clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Manual payment fields
  manual_tx_id TEXT,
  manual_amount DECIMAL(10,2),
  receipt_uploaded_at TIMESTAMP WITH TIME ZONE,
  receipt_urls TEXT[], -- Array of uploaded receipt URLs
  
  -- OCR processing fields
  ocr_processed_at TIMESTAMP WITH TIME ZONE,
  ocr_extracted_tx_id TEXT,
  ocr_extracted_amount DECIMAL(10,2),
  ocr_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ocr_raw_text TEXT,
  
  -- Auto-matching fields
  auto_matched_at TIMESTAMP WITH TIME ZONE,
  auto_match_confidence DECIMAL(3,2),
  auto_match_reason TEXT,
  
  -- Admin verification fields
  admin_verified_at TIMESTAMP WITH TIME ZONE,
  admin_verified_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  verification_method TEXT CHECK (verification_method IN ('auto', 'manual', 'bank_statement', 'sms_verification')),
  
  -- Metadata
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Payment_requests RLS policies
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment requests" ON payment_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment requests" ON payment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_item_type ON payment_requests(item_type);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_manual_tx_id ON payment_requests(manual_tx_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_ocr_extracted_tx_id ON payment_requests(ocr_extracted_tx_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_auto_matched_at ON payment_requests(auto_matched_at);

-- =============================================
-- PAYMENT_VERIFICATION_LOGS TABLE
-- =============================================
-- Log all payment verification attempts and results
CREATE TABLE IF NOT EXISTS payment_verification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('auto_match', 'ocr_processing', 'admin_verification', 'bank_statement_check', 'sms_verification')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  details JSONB,
  error_message TEXT,
  processed_by UUID REFERENCES auth.users(id), -- NULL for auto processes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_verification_logs
ALTER TABLE payment_verification_logs ENABLE ROW LEVEL SECURITY;

-- Payment_verification_logs RLS policies
CREATE POLICY "Users can view logs for own payment requests" ON payment_verification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payment_requests pr
      WHERE pr.id = payment_verification_logs.payment_request_id
      AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all verification logs" ON payment_verification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_payment_request_id ON payment_verification_logs(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_verification_type ON payment_verification_logs(verification_type);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_status ON payment_verification_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_created_at ON payment_verification_logs(created_at);

-- =============================================
-- AUTO_MATCHING_RULES TABLE
-- =============================================
-- Configurable rules for automatic payment matching
CREATE TABLE IF NOT EXISTS auto_matching_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('amount_match', 'tx_id_pattern', 'time_window', 'user_history')),
  conditions JSONB NOT NULL, -- Flexible conditions for matching
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8, -- Minimum confidence for auto-approval
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules run first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on auto_matching_rules
ALTER TABLE auto_matching_rules ENABLE ROW LEVEL SECURITY;

-- Auto_matching_rules RLS policies
CREATE POLICY "Admins can manage auto matching rules" ON auto_matching_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_matching_rules_rule_type ON auto_matching_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_auto_matching_rules_is_active ON auto_matching_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_matching_rules_priority ON auto_matching_rules(priority);

-- =============================================
-- STORAGE BUCKETS UPDATE
-- =============================================
-- Update storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- =============================================
-- STORAGE POLICIES UPDATE
-- =============================================
-- Payment receipts storage policies
CREATE POLICY "Users can upload payment receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own payment receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (
      -- User owns the receipt (based on file path containing user_id)
      name LIKE '%' || auth.uid()::text || '%'
      OR
      -- Admin can view all receipts
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage all payment receipts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_wallet_config_updated_at BEFORE UPDATE ON wallet_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_matching_rules_updated_at BEFORE UPDATE ON auto_matching_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to add book to user library after payment completion
CREATE OR REPLACE FUNCTION add_item_to_library_after_payment(
  p_payment_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record RECORD;
  book_record RECORD;
BEGIN
  -- Get payment request details
  SELECT pr.user_id, pr.item_type, pr.item_id
  INTO payment_record
  FROM payment_requests pr
  WHERE pr.id = p_payment_request_id
  AND pr.status = 'completed';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Add books to library based on item type
  IF payment_record.item_type = 'book' THEN
    -- Add single book
    INSERT INTO user_library (user_id, book_id, status)
    VALUES (payment_record.user_id, payment_record.item_id, 'owned')
    ON CONFLICT (user_id, book_id)
    DO UPDATE SET status = 'owned', added_at = NOW();
    
  ELSIF payment_record.item_type = 'bundle' THEN
    -- Add all books in the bundle
    FOR book_record IN
      SELECT bb.book_id
      FROM bundle_books bb
      WHERE bb.bundle_id = payment_record.item_id
    LOOP
      INSERT INTO user_library (user_id, book_id, status)
      VALUES (payment_record.user_id, book_record.book_id, 'owned')
      ON CONFLICT (user_id, book_id)
      DO UPDATE SET status = 'owned', added_at = NOW();
    END LOOP;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to process auto-matching rules
CREATE OR REPLACE FUNCTION process_auto_matching_rules(
  p_payment_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record RECORD;
  rule_record RECORD;
  match_confidence DECIMAL(3,2) := 0.0;
  best_match_confidence DECIMAL(3,2) := 0.0;
  best_match_rule_id UUID;
  result JSONB := '{"matched": false, "confidence": 0.0, "rule_id": null}';
BEGIN
  -- Get payment request details
  SELECT *
  INTO payment_record
  FROM payment_requests
  WHERE id = p_payment_request_id
  AND status IN ('payment_initiated', 'pending');

  IF NOT FOUND THEN
    RETURN result;
  END IF;

  -- Process each active rule in priority order
  FOR rule_record IN
    SELECT *
    FROM auto_matching_rules
    WHERE is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    -- Apply rule logic based on type
    CASE rule_record.rule_type
      WHEN 'amount_match' THEN
        -- Check if amount matches within tolerance
        IF payment_record.manual_amount IS NOT NULL THEN
          IF ABS(payment_record.manual_amount - payment_record.amount) <= 
             (payment_record.amount * (rule_record.conditions->>'tolerance_percentage')::DECIMAL / 100) THEN
            match_confidence := (rule_record.conditions->>'base_confidence')::DECIMAL;
          END IF;
        END IF;
        
      WHEN 'tx_id_pattern' THEN
        -- Check if TX ID matches expected pattern
        IF payment_record.manual_tx_id IS NOT NULL THEN
          IF payment_record.manual_tx_id ~ (rule_record.conditions->>'pattern') THEN
            match_confidence := (rule_record.conditions->>'base_confidence')::DECIMAL;
          END IF;
        END IF;
        
      WHEN 'time_window' THEN
        -- Check if payment was made within expected time window
        IF payment_record.deep_link_clicked_at IS NOT NULL THEN
          IF payment_record.manual_tx_id IS NOT NULL AND
             payment_record.manual_tx_id != '' THEN
            -- Check if TX ID was provided within time window
            IF EXTRACT(EPOCH FROM (NOW() - payment_record.deep_link_clicked_at)) <= 
               (rule_record.conditions->>'max_minutes')::INTEGER * 60 THEN
              match_confidence := (rule_record.conditions->>'base_confidence')::DECIMAL;
            END IF;
          END IF;
        END IF;
        
      WHEN 'user_history' THEN
        -- Check user's payment history for patterns
        IF EXISTS (
          SELECT 1 FROM payment_requests pr2
          WHERE pr2.user_id = payment_record.user_id
          AND pr2.status = 'completed'
          AND pr2.manual_tx_id IS NOT NULL
          AND pr2.manual_tx_id != ''
        ) THEN
          match_confidence := (rule_record.conditions->>'base_confidence')::DECIMAL;
        END IF;
    END CASE;

    -- Update best match if this rule has higher confidence
    IF match_confidence > best_match_confidence THEN
      best_match_confidence := match_confidence;
      best_match_rule_id := rule_record.id;
    END IF;
  END LOOP;

  -- Check if best match meets confidence threshold
  IF best_match_confidence >= 0.8 THEN -- Default threshold
    result := jsonb_build_object(
      'matched', true,
      'confidence', best_match_confidence,
      'rule_id', best_match_rule_id
    );
  END IF;

  RETURN result;
END;
$$;

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default wallet configurations
INSERT INTO wallet_config (wallet_name, wallet_type, deep_link_template, tx_id_pattern, is_active, display_order, instructions)
VALUES
  ('Telebirr', 'mobile_money', 'telebirr://send?amount={amount}&reference={reference}', '^[0-9]{10,15}$', true, 1, 'Send payment via Telebirr and paste the transaction ID below'),
  ('M-Birr', 'mobile_money', 'mbirr://transfer?amount={amount}&ref={reference}', '^[A-Z0-9]{8,12}$', true, 2, 'Send payment via M-Birr and paste the reference number below'),
  ('CBE Mobile', 'bank_app', 'cbe://transfer?amount={amount}&reference={reference}', '^CBE[0-9]{10,15}$', true, 3, 'Open CBE Mobile app and transfer the amount'),
  ('Dashen Mobile', 'bank_app', 'dashen://transfer?amount={amount}&reference={reference}', '^DSH[0-9]{10,15}$', true, 4, 'Open Dashen Mobile app and transfer the amount'),
  ('Chapa', 'mobile_money', 'chapa://pay?amount={amount}&reference={reference}', '^CHP[0-9]{10,15}$', true, 5, 'Pay via Chapa and paste the transaction ID below')
ON CONFLICT DO NOTHING;

-- Insert default auto-matching rules
INSERT INTO auto_matching_rules (rule_name, rule_type, conditions, confidence_threshold, is_active, priority)
VALUES
  ('Exact Amount Match', 'amount_match', '{"base_confidence": 0.9, "tolerance_percentage": 0}', 0.8, true, 100),
  ('Amount Match with 5% Tolerance', 'amount_match', '{"base_confidence": 0.8, "tolerance_percentage": 5}', 0.7, true, 90),
  ('Telebirr TX ID Pattern', 'tx_id_pattern', '{"base_confidence": 0.7, "pattern": "^[0-9]{10,15}$"}', 0.6, true, 80),
  ('M-Birr Reference Pattern', 'tx_id_pattern', '{"base_confidence": 0.7, "pattern": "^[A-Z0-9]{8,12}$"}', 0.6, true, 80),
  ('Time Window Match (30 min)', 'time_window', '{"base_confidence": 0.6, "max_minutes": 30}', 0.5, true, 70),
  ('Returning User Bonus', 'user_history', '{"base_confidence": 0.5}', 0.4, true, 60)
ON CONFLICT DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for anonymous users (for public content)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON wallet_config TO anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_item_to_library_after_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_auto_matching_rules(UUID) TO authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that all tables were created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('wallet_config', 'payment_requests', 'payment_verification_logs', 'auto_matching_rules')
ORDER BY tablename;

-- Check that functions were created
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_item_to_library_after_payment',
  'process_auto_matching_rules',
  'update_updated_at_column'
)
ORDER BY routine_name;

-- Check seed data
SELECT 'wallet_config' as table_name, COUNT(*) as record_count FROM wallet_config
UNION ALL
SELECT 'auto_matching_rules' as table_name, COUNT(*) as record_count FROM auto_matching_rules;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- This migration creates a simplified payment system with:
-- ✅ Wallet deep-link integration
-- ✅ Manual TX ID entry
-- ✅ OCR receipt processing support
-- ✅ Auto-matching rules engine
-- ✅ Admin verification dashboard support
-- ✅ Comprehensive logging and audit trail
--
-- NEXT STEPS:
-- 1. Update application code to use new schema
-- 2. Implement OCR integration
-- 3. Create new payment UI components
-- 4. Build admin verification dashboard
-- 5. Test the complete payment workflow
--
-- =============================================


