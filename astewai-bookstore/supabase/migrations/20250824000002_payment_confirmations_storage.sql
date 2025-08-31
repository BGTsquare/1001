-- Payment Confirmations Storage Setup
-- This migration sets up the storage bucket and policies for payment confirmation files

-- Create bucket for payment confirmation files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-confirmations',
  'payment-confirmations',
  false, -- Private bucket - only accessible by users and admins
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES for payment-confirmations bucket

-- Users can upload their own payment confirmations
CREATE POLICY "Users can upload payment confirmations" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-confirmations' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    -- Ensure user has a valid purchase request
    EXISTS (
      SELECT 1 FROM purchase_requests 
      WHERE user_id = auth.uid() 
      AND status IN ('pending', 'contacted')
    )
  );

-- Users can view their own payment confirmation files
CREATE POLICY "Users can view own payment confirmations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-confirmations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own payment confirmation files (replace)
CREATE POLICY "Users can update own payment confirmations" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'payment-confirmations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own payment confirmation files
CREATE POLICY "Users can delete own payment confirmations" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-confirmations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all payment confirmation files
CREATE POLICY "Admins can view all payment confirmations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-confirmations' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete payment confirmation files if needed
CREATE POLICY "Admins can delete payment confirmations" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-confirmations' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create helper function to generate secure file paths
CREATE OR REPLACE FUNCTION generate_payment_confirmation_path(
  user_id UUID,
  purchase_request_id UUID,
  file_extension TEXT
) RETURNS TEXT AS $$
DECLARE
  timestamp_str TEXT;
  random_suffix TEXT;
BEGIN
  -- Generate timestamp string
  timestamp_str := to_char(NOW(), 'YYYYMMDD_HH24MISS');
  
  -- Generate random suffix for uniqueness
  random_suffix := substr(gen_random_uuid()::text, 1, 8);
  
  -- Return structured path: user_id/purchase_request_id/timestamp_random.ext
  RETURN user_id::text || '/' || 
         purchase_request_id::text || '/' || 
         timestamp_str || '_' || random_suffix || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_payment_confirmation_path(UUID, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION generate_payment_confirmation_path IS 'Generates secure file paths for payment confirmation uploads';
