-- Payment Confirmation System Enhancement
-- This migration adds support for payment confirmation file uploads

-- Create payment_confirmations table
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Path in Supabase storage
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- Max 5MB
  file_type VARCHAR(100) NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  
  -- Upload metadata
  upload_ip INET,
  user_agent TEXT,
  
  -- Admin review
  admin_reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invalid')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_purchase_request_id ON payment_confirmations(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_user_id ON payment_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_created_at ON payment_confirmations(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_confirmations_updated_at
  BEFORE UPDATE ON payment_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_confirmations_updated_at();

-- Add new columns to purchase_requests table for enhanced tracking
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS payment_confirmation_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_confirmation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_confirmation_status VARCHAR(50);

-- Create function to update purchase_requests when confirmations are added
CREATE OR REPLACE FUNCTION update_purchase_request_confirmation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update purchase request with confirmation info
    UPDATE purchase_requests 
    SET 
      payment_confirmation_uploaded_at = COALESCE(payment_confirmation_uploaded_at, NEW.created_at),
      payment_confirmation_count = payment_confirmation_count + 1,
      last_confirmation_status = NEW.status,
      status = CASE 
        WHEN status = 'pending' THEN 'contacted'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.purchase_request_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update last confirmation status
    UPDATE purchase_requests 
    SET 
      last_confirmation_status = NEW.status,
      updated_at = NOW()
    WHERE id = NEW.purchase_request_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Recalculate confirmation count
    UPDATE purchase_requests 
    SET 
      payment_confirmation_count = (
        SELECT COUNT(*) 
        FROM payment_confirmations 
        WHERE purchase_request_id = OLD.purchase_request_id
      ),
      updated_at = NOW()
    WHERE id = OLD.purchase_request_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase request updates
CREATE TRIGGER payment_confirmation_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_request_confirmation_stats();

-- RLS Policies for payment_confirmations

-- Enable RLS
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Users can view their own confirmations
CREATE POLICY "Users can view own payment confirmations" ON payment_confirmations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own confirmations
CREATE POLICY "Users can upload payment confirmations" ON payment_confirmations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM purchase_requests 
      WHERE id = purchase_request_id 
      AND user_id = auth.uid()
      AND status IN ('pending', 'contacted')
    )
  );

-- Users can update their own pending confirmations (limited fields)
CREATE POLICY "Users can update own pending confirmations" ON payment_confirmations
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status = 'pending'
  ) WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can view all confirmations
CREATE POLICY "Admins can view all payment confirmations" ON payment_confirmations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update confirmations (for review)
CREATE POLICY "Admins can update payment confirmations" ON payment_confirmations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete confirmations if needed
CREATE POLICY "Admins can delete payment confirmations" ON payment_confirmations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add comment for documentation
COMMENT ON TABLE payment_confirmations IS 'Stores payment confirmation files uploaded by users for manual payment verification';
COMMENT ON COLUMN payment_confirmations.file_path IS 'Path to file in Supabase storage bucket payment-confirmations';
COMMENT ON COLUMN payment_confirmations.status IS 'Status of the payment confirmation: pending, approved, rejected, invalid';
